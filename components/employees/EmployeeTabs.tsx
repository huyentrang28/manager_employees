'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { GraduationCap, Briefcase, Award, AlertTriangle, FileText, Shield, DollarSign } from 'lucide-react'

interface EmployeeTabsProps {
  employeeId: string
}

export function EmployeeTabs({ employeeId }: EmployeeTabsProps) {
  const [activeTab, setActiveTab] = useState('education')
  const [data, setData] = useState<any>({
    education: [],
    experience: [],
    rewards: [],
    discipline: [],
    contracts: [],
    documents: [],
    insurance: [],
    salary: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [employeeId])

  const fetchAllData = async () => {
    try {
      const [educationRes, experienceRes, rewardsRes, disciplineRes, contractsRes, documentsRes, insuranceRes, salaryRes] = await Promise.all([
        fetch(`/api/employees/${employeeId}/education`),
        fetch(`/api/employees/${employeeId}/experience`),
        fetch(`/api/employees/${employeeId}/rewards`),
        fetch(`/api/employees/${employeeId}/discipline`),
        fetch(`/api/contracts?employeeId=${employeeId}`),
        fetch(`/api/documents?employeeId=${employeeId}`),
        fetch(`/api/insurance?employeeId=${employeeId}`),
        fetch(`/api/employees/${employeeId}/salary-history`),
      ])

      const education = educationRes.ok ? await educationRes.json() : []
      const experience = experienceRes.ok ? await experienceRes.json() : []
      const rewards = rewardsRes.ok ? await rewardsRes.json() : []
      const discipline = disciplineRes.ok ? await disciplineRes.json() : []
      const contracts = contractsRes.ok ? await contractsRes.json() : []
      const documents = documentsRes.ok ? await documentsRes.json() : []
      const insurance = insuranceRes.ok ? await insuranceRes.json() : []
      const salary = salaryRes.ok ? await salaryRes.json() : null

      // Đảm bảo tất cả đều là array
      setData({
        education: Array.isArray(education) ? education : [],
        experience: Array.isArray(experience) ? experience : [],
        rewards: Array.isArray(rewards) ? rewards : [],
        discipline: Array.isArray(discipline) ? discipline : [],
        contracts: Array.isArray(contracts) ? contracts : [],
        documents: Array.isArray(documents) ? documents : [],
        insurance: Array.isArray(insurance) ? insurance : [],
        salary,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      // Đảm bảo data luôn là array ngay cả khi có lỗi
      setData({
        education: [],
        experience: [],
        rewards: [],
        discipline: [],
        contracts: [],
        documents: [],
        insurance: [],
        salary: null,
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'education', label: 'Học vấn', icon: GraduationCap, count: Array.isArray(data.education) ? data.education.length : 0 },
    { id: 'experience', label: 'Kinh nghiệm', icon: Briefcase, count: Array.isArray(data.experience) ? data.experience.length : 0 },
    { id: 'rewards', label: 'Khen thưởng', icon: Award, count: Array.isArray(data.rewards) ? data.rewards.length : 0 },
    { id: 'discipline', label: 'Kỷ luật', icon: AlertTriangle, count: Array.isArray(data.discipline) ? data.discipline.length : 0 },
    { id: 'contracts', label: 'Hợp đồng', icon: FileText, count: Array.isArray(data.contracts) ? data.contracts.length : 0 },
    { id: 'salary', label: 'Lương', icon: DollarSign, count: data.salary?.totalMonths || 0 },
    { id: 'documents', label: 'Tài liệu', icon: FileText, count: Array.isArray(data.documents) ? data.documents.length : 0 },
    { id: 'insurance', label: 'Bảo hiểm', icon: Shield, count: Array.isArray(data.insurance) ? data.insurance.length : 0 },
  ]

  if (loading) {
    return <div className="p-6">Đang tải...</div>
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'education' && (
          <div className="space-y-4">
            {!Array.isArray(data.education) || data.education.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">Chưa có thông tin học vấn</Card>
            ) : (
              data.education.map((edu: any) => (
                <Card key={edu.id} className="p-4">
                  <h4 className="font-semibold">{edu.degree}</h4>
                  <p className="text-gray-600">{edu.institution}</p>
                  {edu.field && <p className="text-sm text-gray-500">Chuyên ngành: {edu.field}</p>}
                  {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
                  <p className="text-sm text-gray-500">
                    {edu.startDate && new Date(edu.startDate).toLocaleDateString('vi-VN')} -{' '}
                    {edu.endDate ? new Date(edu.endDate).toLocaleDateString('vi-VN') : 'Hiện tại'}
                  </p>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-4">
            {!Array.isArray(data.experience) || data.experience.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">Chưa có thông tin kinh nghiệm</Card>
            ) : (
              data.experience.map((exp: any) => (
                <Card key={exp.id} className="p-4">
                  <h4 className="font-semibold">{exp.position}</h4>
                  <p className="text-gray-600">{exp.company}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(exp.startDate).toLocaleDateString('vi-VN')} -{' '}
                    {exp.isCurrent ? 'Hiện tại' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('vi-VN') : ''}
                  </p>
                  {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="space-y-4">
            {!Array.isArray(data.rewards) || data.rewards.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">Chưa có khen thưởng</Card>
            ) : (
              data.rewards.map((reward: any) => (
                <Card key={reward.id} className="p-4 border-l-4 border-green-500">
                  <h4 className="font-semibold">{reward.title}</h4>
                  <p className="text-sm text-gray-500">Loại: {reward.rewardType}</p>
                  {reward.amount && (
                    <p className="text-sm font-semibold text-green-600">
                      {reward.amount.toLocaleString('vi-VN')} VNĐ
                    </p>
                  )}
                  {reward.description && <p className="text-sm text-gray-600 mt-2">{reward.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(reward.date).toLocaleDateString('vi-VN')}
                  </p>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'discipline' && (
          <div className="space-y-4">
            {!Array.isArray(data.discipline) || data.discipline.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">Chưa có kỷ luật</Card>
            ) : (
              data.discipline.map((disc: any) => (
                <Card key={disc.id} className="p-4 border-l-4 border-red-500">
                  <h4 className="font-semibold">{disc.title}</h4>
                  <p className="text-sm text-gray-500">
                    Loại: {disc.violationType} • Mức độ: {disc.severity}
                  </p>
                  {disc.description && <p className="text-sm text-gray-600 mt-2">{disc.description}</p>}
                  {disc.actionTaken && (
                    <p className="text-sm text-red-600 mt-2">Hành động: {disc.actionTaken}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(disc.date).toLocaleDateString('vi-VN')}
                  </p>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {!Array.isArray(data.contracts) || data.contracts.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">Chưa có hợp đồng</Card>
            ) : (
              data.contracts.map((contract: any) => (
                <Card key={contract.id} className="p-4">
                  <h4 className="font-semibold">{contract.contractNumber}</h4>
                  <p className="text-sm text-gray-500">Loại: {contract.contractType}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(contract.startDate).toLocaleDateString('vi-VN')} -{' '}
                    {contract.isIndefinite
                      ? 'Không xác định'
                      : contract.endDate
                      ? new Date(contract.endDate).toLocaleDateString('vi-VN')
                      : ''}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                    contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {contract.status}
                  </span>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'salary' && (
          <div className="space-y-4">
            {!data.salary || !data.salary.salaryHistory || data.salary.salaryHistory.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                {data.salary?.message || 'Chưa có thông tin lương'}
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {data.salary.employee.name} ({data.salary.employee.employeeId})
                  </h3>
                  {data.salary.contract && (
                    <div className="text-sm text-gray-600">
                      <p>Hợp đồng: {data.salary.contract.contractNumber}</p>
                      <p>Lương cơ bản: {data.salary.contract.salary?.toLocaleString('vi-VN') || 0} VNĐ</p>
                      <p>Bắt đầu từ: {new Date(data.salary.contract.startDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">Tháng</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Lương cơ bản</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Phụ cấp</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Làm thêm</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Thưởng</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Tổng thu nhập</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Khấu trừ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Thuế</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Thực nhận</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.salary.salaryHistory.map((month: any) => (
                      <tr key={month.payPeriod} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">
                          {month.monthName}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 border-b">
                          {month.baseSalary.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 border-b">
                          {month.allowances.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 border-b">
                          {month.overtime.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-medium border-b">
                          {month.bonuses.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600 font-semibold border-b">
                          {month.grossPay.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 border-b">
                          {month.deductions.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 border-b">
                          {month.tax.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-bold border-b">
                          {month.netPay.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-center border-b">
                          <span className={`px-2 py-1 text-xs rounded ${
                            month.status === 'PAID' 
                              ? 'bg-green-100 text-green-800' 
                              : month.status === 'PROCESSED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }                          `}>
                            {month.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900 border-t">Tổng cộng</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border-t">
                        {data.salary.salaryHistory.reduce((sum: number, m: any) => sum + m.baseSalary, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border-t">
                        {data.salary.salaryHistory.reduce((sum: number, m: any) => sum + m.allowances, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border-t">
                        {data.salary.salaryHistory.reduce((sum: number, m: any) => sum + m.overtime, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 border-t">
                        {data.salary.salaryHistory.reduce((sum: number, m: any) => sum + m.bonuses, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 border-t">
                        {data.salary.salaryHistory.reduce((sum: number, m: any) => sum + m.grossPay, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 border-t">
                        {data.salary.salaryHistory.reduce((sum: number, m: any) => sum + m.deductions, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 border-t">
                        {data.salary.salaryHistory.reduce((sum: number, m: any) => sum + m.tax, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 border-t">
                        {data.salary.salaryHistory.reduce((sum: number, m: any) => sum + m.netPay, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 border-t"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {!Array.isArray(data.documents) || data.documents.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">Chưa có tài liệu</Card>
            ) : (
              data.documents.map((doc: any) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{doc.name}</h4>
                      <p className="text-sm text-gray-500">Loại: {doc.type}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Xem
                    </a>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'insurance' && (
          <div className="space-y-4">
            {!Array.isArray(data.insurance) || data.insurance.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">Chưa có bảo hiểm</Card>
            ) : (
              data.insurance.map((ins: any) => (
                <Card key={ins.id} className="p-4">
                  <h4 className="font-semibold">{ins.insuranceType}</h4>
                  {ins.policyNumber && <p className="text-sm text-gray-500">Số hợp đồng: {ins.policyNumber}</p>}
                  {ins.provider && <p className="text-sm text-gray-500">Nhà cung cấp: {ins.provider}</p>}
                  <p className="text-sm text-gray-500">
                    {new Date(ins.startDate).toLocaleDateString('vi-VN')} -{' '}
                    {ins.endDate ? new Date(ins.endDate).toLocaleDateString('vi-VN') : 'Hiện tại'}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                    ins.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {ins.status}
                  </span>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

