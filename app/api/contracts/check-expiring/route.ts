import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API endpoint to check for expiring contracts and create notifications
 * This can be called periodically (e.g., via cron job) or manually
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // Allow HR, BOARD, or system calls (no session for cron jobs)
    if (session && session.user.role !== 'HR' && session.user.role !== 'BOARD') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const daysBeforeExpiry = body.daysBeforeExpiry || 30 // Default: notify 30 days before expiry

    const now = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry)

    // Find contracts expiring within the specified days
    const expiringContracts = await prisma.laborContract.findMany({
      where: {
        status: 'ACTIVE',
        isIndefinite: false,
        endDate: {
          gte: now,
          lte: expiryDate,
        },
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    })

    let notificationsCreated = 0
    const errors: string[] = []

    for (const contract of expiringContracts) {
      try {
        // Chỉ gửi thông báo cho nhân viên sở hữu hợp đồng
        if (!contract.employee.user) {
          console.warn(`Contract ${contract.contractNumber} has no associated user, skipping notification`)
          continue
        }

        // Calculate days until expiry
        const daysUntilExpiry = Math.ceil(
          (contract.endDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Check if notification already exists for this contract (to avoid duplicates)
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: contract.employee.user.id,
            type: 'CONTRACT_EXPIRY',
            message: {
              contains: contract.contractNumber,
            },
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
            },
          },
        })

        // Only create notification if it doesn't exist recently
        if (!existingNotification) {
          const endDateFormatted = contract.endDate!.toLocaleDateString('vi-VN')
          
          // Gửi thông báo cho nhân viên sở hữu hợp đồng
          await prisma.notification.create({
            data: {
              userId: contract.employee.user.id,
              title: 'Hợp đồng sắp hết hạn',
              message: `Hợp đồng ${contract.contractNumber} của bạn sẽ hết hạn sau ${daysUntilExpiry} ngày (${endDateFormatted}). Vui lòng liên hệ phòng HR để gia hạn hoặc ký hợp đồng mới.`,
              type: 'CONTRACT_EXPIRY',
              link: `/contracts`,
            },
          })
          notificationsCreated++

          // Gửi thông báo cho HR và BOARD (admin) về hợp đồng sắp hết hạn của nhân viên này
          const hrBoardUsers = await prisma.user.findMany({
            where: {
              role: {
                in: ['HR', 'BOARD'], // BOARD = admin
              },
            },
            select: {
              id: true,
            },
          })

          for (const hrBoardUser of hrBoardUsers) {
            // Check if notification already exists for HR/BOARD
            const existingHrNotification = await prisma.notification.findFirst({
              where: {
                userId: hrBoardUser.id,
                type: 'CONTRACT_EXPIRY',
                message: {
                  contains: contract.contractNumber,
                },
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
                },
              },
            })

            if (!existingHrNotification) {
              await prisma.notification.create({
                data: {
                  userId: hrBoardUser.id,
                  title: 'Hợp đồng sắp hết hạn',
                  message: `Hợp đồng ${contract.contractNumber} của nhân viên ${contract.employee.firstName} ${contract.employee.lastName} (${contract.employee.employeeId}) sẽ hết hạn sau ${daysUntilExpiry} ngày (${endDateFormatted}). Vui lòng liên hệ nhân viên để gia hạn hoặc ký hợp đồng mới.`,
                  type: 'CONTRACT_EXPIRY',
                  link: `/contracts`,
                },
              })
              notificationsCreated++
            }
          }
        }
      } catch (error: any) {
        console.error(`Error creating notification for contract ${contract.id}:`, error)
        errors.push(`Contract ${contract.contractNumber}: ${error.message}`)
      }
    }

    // Kiểm tra và thông báo các hợp đồng đã hết hạn
    const expiredContracts = await prisma.laborContract.findMany({
      where: {
        status: 'ACTIVE',
        isIndefinite: false,
        endDate: {
          lt: now, // Đã hết hạn
        },
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    })

    for (const contract of expiredContracts) {
      try {
        // Chỉ gửi thông báo cho nhân viên sở hữu hợp đồng
        if (!contract.employee.user) {
          console.warn(`Contract ${contract.contractNumber} has no associated user, skipping notification`)
          continue
        }

        // Check if notification already exists for this expired contract
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: contract.employee.user.id,
            type: 'CONTRACT_EXPIRY',
            title: {
              contains: 'Hợp đồng đã hết hạn',
            },
            message: {
              contains: contract.contractNumber,
            },
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
            },
          },
        })

        // Only create notification if it doesn't exist recently
        if (!existingNotification) {
          const endDateFormatted = contract.endDate!.toLocaleDateString('vi-VN')
          
          // Gửi thông báo cho nhân viên sở hữu hợp đồng
          await prisma.notification.create({
            data: {
              userId: contract.employee.user.id,
              title: 'Hợp đồng đã hết hạn',
              message: `Hợp đồng ${contract.contractNumber} của bạn đã hết hạn vào ngày ${endDateFormatted}. Vui lòng liên hệ phòng HR để gia hạn hoặc ký hợp đồng mới ngay lập tức.`,
              type: 'CONTRACT_EXPIRY',
              link: `/contracts`,
            },
          })
          notificationsCreated++

          // Gửi thông báo cho HR và BOARD (admin) về hợp đồng đã hết hạn của nhân viên này
          const hrBoardUsers = await prisma.user.findMany({
            where: {
              role: {
                in: ['HR', 'BOARD'], // BOARD = admin
              },
            },
            select: {
              id: true,
            },
          })

          for (const hrBoardUser of hrBoardUsers) {
            // Check if notification already exists for HR/BOARD
            const existingHrNotification = await prisma.notification.findFirst({
              where: {
                userId: hrBoardUser.id,
                type: 'CONTRACT_EXPIRY',
                title: {
                  contains: 'Hợp đồng đã hết hạn',
                },
                message: {
                  contains: contract.contractNumber,
                },
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
                },
              },
            })

            if (!existingHrNotification) {
              await prisma.notification.create({
                data: {
                  userId: hrBoardUser.id,
                  title: 'Hợp đồng đã hết hạn',
                  message: `Hợp đồng ${contract.contractNumber} của nhân viên ${contract.employee.firstName} ${contract.employee.lastName} (${contract.employee.employeeId}) đã hết hạn vào ngày ${endDateFormatted}. Vui lòng liên hệ nhân viên để gia hạn hoặc ký hợp đồng mới ngay lập tức.`,
                  type: 'CONTRACT_EXPIRY',
                  link: `/contracts`,
                },
              })
              notificationsCreated++
            }
          }

          // Cập nhật trạng thái hợp đồng thành EXPIRED
          await prisma.laborContract.update({
            where: { id: contract.id },
            data: { status: 'EXPIRED' },
          })
        }
      } catch (error: any) {
        console.error(`Error creating notification for expired contract ${contract.id}:`, error)
        errors.push(`Expired Contract ${contract.contractNumber}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      expiringContractsCount: expiringContracts.length,
      notificationsCreated,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error checking expiring contracts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to preview expiring contracts without creating notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const daysBeforeExpiry = parseInt(searchParams.get('days') || '30')

    const now = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry)

    const expiringContracts = await prisma.laborContract.findMany({
      where: {
        status: 'ACTIVE',
        isIndefinite: false,
        endDate: {
          gte: now,
          lte: expiryDate,
        },
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    })

    // Calculate days until expiry for each contract
    const contractsWithDays = expiringContracts.map((contract) => {
      const daysUntilExpiry = Math.ceil(
        (contract.endDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        ...contract,
        daysUntilExpiry,
      }
    })

    return NextResponse.json({
      count: contractsWithDays.length,
      contracts: contractsWithDays,
    })
  } catch (error) {
    console.error('Error fetching expiring contracts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

