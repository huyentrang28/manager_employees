import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { NewTrainingForm } from '@/components/training/NewTrainingForm'

function canManage(role?: string) {
  return role === 'HR' || role === 'BOARD'
}

export default async function NewTrainingPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  if (!canManage(session.user.role)) {
    redirect('/training')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/training">
          <Button variant="outline" size="sm">
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thêm chương trình đào tạo</h1>
          <p className="text-gray-600 mt-2">
            Tạo mới chương trình đào tạo cho nhân viên
          </p>
        </div>
      </div>

      <NewTrainingForm />
    </div>
  )
}








