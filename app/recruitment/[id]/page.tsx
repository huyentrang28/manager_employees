import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { JobPostingDetail } from '@/components/recruitment/JobPostingDetail'

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

async function getJobPosting(id: string) {
  // Validate ObjectID format
  if (!isValidObjectId(id)) {
    return null
  }
  
  return await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      _count: {
        select: { applications: true },
      },
      applications: {
        orderBy: { appliedDate: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          appliedDate: true,
          resume: true,
          coverLetter: true,
        },
      },
    },
  })
}

export default async function JobPostingDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await Promise.resolve(params)
  const job = await getJobPosting(resolvedParams.id)

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Không tìm thấy tin tuyển dụng.
        </div>
      </div>
    )
  }

  return <JobPostingDetail job={job} userRole={session.user.role} />
}
