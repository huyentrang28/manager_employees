'use client'

import Link from 'next/link'
import { Building2, Users, Target, Award, ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">HRMS System</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-600 font-medium flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Về chúng tôi</h2>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Chúng tôi là một công ty chuyên nghiệp với sứ mệnh xây dựng môi trường làm việc tốt nhất
              và phát triển nguồn nhân lực chất lượng cao.
            </p>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Giới thiệu</h3>
              <div className="space-y-4 text-gray-600">
                <p>
                  Chúng tôi là một công ty hàng đầu trong lĩnh vực công nghệ và dịch vụ, với hơn 10 năm
                  kinh nghiệm trong việc phát triển và cung cấp các giải pháp chuyên nghiệp cho khách hàng.
                </p>
                <p>
                  Với đội ngũ nhân viên tài năng và đam mê, chúng tôi luôn nỗ lực để mang lại giá trị tốt nhất
                  cho khách hàng và tạo ra môi trường làm việc năng động, sáng tạo.
                </p>
                <p>
                  Chúng tôi tin rằng con người là tài sản quý giá nhất của công ty, và chúng tôi luôn đầu tư
                  vào việc phát triển và đào tạo nhân viên để họ có thể phát huy tối đa tiềm năng của mình.
                </p>
              </div>
            </div>
            <div className="bg-primary-50 rounded-lg p-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Thông tin công ty</h4>
              <div className="space-y-3 text-gray-600">
                <p><strong className="text-gray-900">Tên công ty:</strong> HRMS System</p>
                <p><strong className="text-gray-900">Lĩnh vực:</strong> Công nghệ thông tin</p>
                <p><strong className="text-gray-900">Quy mô:</strong> 100+ nhân viên</p>
                <p><strong className="text-gray-900">Địa chỉ:</strong> Việt Nam</p>
                <p><strong className="text-gray-900">Email:</strong> contact@hrms.com</p>
                <p><strong className="text-gray-900">Điện thoại:</strong> +84 123 456 789</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h3>
            <p className="text-lg text-gray-600">
              Những giá trị định hướng hoạt động và phát triển của chúng tôi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Tinh thần đồng đội</h4>
              <p className="text-gray-600">
                Chúng tôi tin vào sức mạnh của làm việc nhóm và hợp tác
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <Target className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Định hướng kết quả</h4>
              <p className="text-gray-600">
                Chúng tôi tập trung vào kết quả và hiệu quả công việc
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <Award className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Chất lượng</h4>
              <p className="text-gray-600">
                Chúng tôi cam kết mang lại chất lượng tốt nhất trong mọi sản phẩm và dịch vụ
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <Building2 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Đổi mới</h4>
              <p className="text-gray-600">
                Chúng tôi luôn tìm kiếm những cách mới để cải thiện và phát triển
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">Sẵn sàng tham gia cùng chúng tôi?</h3>
          <p className="text-xl text-primary-100 mb-8">
            Xem các cơ hội việc làm hiện tại và ứng tuyển ngay hôm nay
          </p>
          <Link
            href="/#jobs"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block"
          >
            Xem việc làm
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 HRMS System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}



