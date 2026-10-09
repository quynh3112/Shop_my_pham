// Dữ liệu khởi tạo cho shop. Sửa thoải mái rồi chạy lại `npm run seed`:
// bản ghi nào đã có (theo slug / tên / email) sẽ được bỏ qua, không bị ghi đè.

const IMG = {
  skincareHero:
    'https://i.pinimg.com/736x/75/14/37/751437b7a230d0d519d5bfe3abe680a6.jpg',
  skincare:
    'https://i.pinimg.com/1200x/a3/20/48/a320481f501bec266ffc9c8c494cff69.jpg',
  makeup:
    'https://i.pinimg.com/736x/3a/cc/58/3acc58ff2232a962db63fd17cf0c51ad.jpg',
  gift: 'https://i.pinimg.com/1200x/2a/ab/1e/2aab1e2156a7873aeec72c2be82fefe4.jpg',
};

export interface SeedCategory {
  name: string;
  slug: string;
  children?: SeedCategory[];
}

// 3 cấp, khớp với menu danh mục ở header (cha -> nhóm -> mục)
export const categories: SeedCategory[] = [
  {
    name: 'Chăm sóc da',
    slug: 'cham-soc-da',
    children: [
      {
        name: 'Làm sạch',
        slug: 'lam-sach',
        children: [
          { name: 'Sữa rửa mặt', slug: 'sua-rua-mat' },
          { name: 'Tẩy trang', slug: 'tay-trang' },
        ],
      },
      {
        name: 'Dưỡng da',
        slug: 'duong-da',
        children: [
          { name: 'Toner', slug: 'toner' },
          { name: 'Serum', slug: 'serum' },
          { name: 'Kem dưỡng', slug: 'kem-duong' },
        ],
      },
      {
        name: 'Chống nắng',
        slug: 'chong-nang',
        children: [{ name: 'Kem chống nắng', slug: 'kem-chong-nang' }],
      },
    ],
  },
  {
    name: 'Trang điểm',
    slug: 'trang-diem',
    children: [
      {
        name: 'Trang điểm nền',
        slug: 'trang-diem-nen',
        children: [
          { name: 'Kem nền', slug: 'kem-nen' },
          { name: 'Phấn phủ', slug: 'phan-phu' },
        ],
      },
      {
        name: 'Trang điểm môi',
        slug: 'trang-diem-moi',
        children: [
          { name: 'Son thỏi', slug: 'son-thoi' },
          { name: 'Son kem', slug: 'son-kem' },
        ],
      },
      {
        name: 'Trang điểm mắt',
        slug: 'trang-diem-mat',
        children: [{ name: 'Mascara', slug: 'mascara' }],
      },
    ],
  },
  {
    name: 'Quà tặng',
    slug: 'qua-tang',
    children: [
      {
        name: 'Bộ quà tặng',
        slug: 'bo-qua-tang',
        children: [
          { name: 'Bộ dưỡng da', slug: 'bo-duong-da' },
          { name: 'Bộ trang điểm', slug: 'bo-trang-diem' },
        ],
      },
    ],
  },
];

export interface SeedProduct {
  name: string;
  categorySlug: string;
  price: number; // VND
  description: string;
  images: string[];
  variants: { name: string; size?: string; initialStock: number }[];
}

export const products: SeedProduct[] = [
  {
    name: 'Sữa rửa mặt dịu nhẹ Gentle Cleanser',
    categorySlug: 'sua-rua-mat',
    price: 185000,
    description:
      'Sữa rửa mặt pH 5.5 tạo bọt mịn, làm sạch bụi bẩn và dầu thừa mà không gây khô căng. Phù hợp mọi loại da, kể cả da nhạy cảm.',
    images: [IMG.skincare],
    variants: [
      { name: 'Tiêu chuẩn', size: '100ml', initialStock: 80 },
      { name: 'Tiêu chuẩn', size: '200ml', initialStock: 50 },
    ],
  },
  {
    name: 'Nước tẩy trang Micellar Rose',
    categorySlug: 'tay-trang',
    price: 159000,
    description:
      'Nước tẩy trang chiết xuất hoa hồng, lấy sạch lớp trang điểm và kem chống nắng chỉ với một lần lau, không cần rửa lại.',
    images: [IMG.skincare],
    variants: [
      { name: 'Tiêu chuẩn', size: '250ml', initialStock: 100 },
      { name: 'Tiêu chuẩn', size: '500ml', initialStock: 40 },
    ],
  },
  {
    name: 'Toner hoa hồng cấp ẩm',
    categorySlug: 'toner',
    price: 220000,
    description:
      'Toner không cồn giúp cân bằng độ ẩm, làm dịu da và chuẩn bị cho các bước dưỡng tiếp theo thẩm thấu tốt hơn.',
    images: [IMG.skincareHero],
    variants: [{ name: 'Tiêu chuẩn', size: '150ml', initialStock: 60 }],
  },
  {
    name: 'Serum Vitamin C sáng da',
    categorySlug: 'serum',
    price: 390000,
    description:
      'Serum 15% Vitamin C kết hợp Vitamin E giúp làm sáng da, mờ thâm và chống oxy hoá. Dùng buổi sáng, kết hợp kem chống nắng.',
    images: [IMG.skincareHero],
    variants: [
      { name: 'Tiêu chuẩn', size: '15ml', initialStock: 40 },
      { name: 'Tiêu chuẩn', size: '30ml', initialStock: 35 },
    ],
  },
  {
    name: 'Serum Niacinamide 10%',
    categorySlug: 'serum',
    price: 320000,
    description:
      'Serum Niacinamide 10% và Zinc 1% hỗ trợ kiểm soát dầu, thu nhỏ lỗ chân lông và làm đều màu da.',
    images: [IMG.skincare],
    variants: [{ name: 'Tiêu chuẩn', size: '30ml', initialStock: 50 }],
  },
  {
    name: 'Kem dưỡng ẩm Ceramide',
    categorySlug: 'kem-duong',
    price: 350000,
    description:
      'Kem dưỡng chứa Ceramide và Hyaluronic Acid giúp phục hồi hàng rào bảo vệ da, cấp ẩm suốt 24 giờ.',
    images: [IMG.skincareHero],
    variants: [{ name: 'Tiêu chuẩn', size: '50ml', initialStock: 45 }],
  },
  {
    name: 'Kem chống nắng SPF50+ PA++++',
    categorySlug: 'kem-chong-nang',
    price: 280000,
    description:
      'Kem chống nắng phổ rộng, kết cấu mỏng nhẹ không vệt trắng, kiềm dầu tốt, dùng được làm lớp lót trang điểm.',
    images: [IMG.skincare],
    variants: [{ name: 'Tiêu chuẩn', size: '50ml', initialStock: 70 }],
  },
  {
    name: 'Kem nền mỏng nhẹ Skin Fit',
    categorySlug: 'kem-nen',
    price: 420000,
    description:
      'Kem nền độ che phủ trung bình, lớp nền tự nhiên như da thật, giữ lớp trang điểm đến 12 giờ.',
    images: [IMG.makeup],
    variants: [
      { name: '21 Sáng', size: '30ml', initialStock: 30 },
      { name: '23 Tự nhiên', size: '30ml', initialStock: 30 },
    ],
  },
  {
    name: 'Phấn phủ kiềm dầu Silky Powder',
    categorySlug: 'phan-phu',
    price: 260000,
    description:
      'Phấn phủ dạng bột siêu mịn giúp cố định lớp nền, kiềm dầu và làm mờ lỗ chân lông.',
    images: [IMG.makeup],
    variants: [{ name: 'Trong suốt', size: '10g', initialStock: 55 }],
  },
  {
    name: 'Son thỏi Satin',
    categorySlug: 'son-thoi',
    price: 249000,
    description:
      'Son thỏi chất satin mềm mượt, lên màu chuẩn ngay lần quẹt đầu, bổ sung dầu dưỡng giúp môi không khô.',
    images: [IMG.makeup],
    variants: [
      { name: '01 Đỏ cổ điển', size: '3.5g', initialStock: 40 },
      { name: '02 Hồng đào', size: '3.5g', initialStock: 40 },
      { name: '03 Nude', size: '3.5g', initialStock: 40 },
    ],
  },
  {
    name: 'Son kem lì Velvet',
    categorySlug: 'son-kem',
    price: 189000,
    description:
      'Son kem lì mịn như nhung, nhẹ môi, bền màu suốt nhiều giờ và hạn chế lem khi ăn uống.',
    images: [IMG.makeup],
    variants: [
      { name: '01 Đỏ gạch', size: '4g', initialStock: 50 },
      { name: '02 Hồng đất', size: '4g', initialStock: 50 },
      { name: '03 Cam cháy', size: '4g', initialStock: 50 },
    ],
  },
  {
    name: 'Mascara dày và cong mi',
    categorySlug: 'mascara',
    price: 210000,
    description:
      'Mascara chống nước, đầu cọ cong giúp tách mi, làm dày và giữ độ cong cả ngày.',
    images: [IMG.makeup],
    variants: [{ name: 'Đen', size: '8ml', initialStock: 60 }],
  },
  {
    name: 'Bộ quà tặng dưỡng da cơ bản',
    categorySlug: 'bo-duong-da',
    price: 690000,
    description:
      'Gồm sữa rửa mặt 100ml, toner 150ml và kem dưỡng ẩm 50ml, đóng hộp quà sẵn kèm thiệp.',
    images: [IMG.gift],
    variants: [{ name: 'Hộp quà', initialStock: 20 }],
  },
  {
    name: 'Bộ quà tặng son môi',
    categorySlug: 'bo-trang-diem',
    price: 520000,
    description:
      'Bộ 3 thỏi son kem lì Velvet với các tông màu bán chạy nhất, đóng hộp quà sang trọng.',
    images: [IMG.gift],
    variants: [{ name: 'Bộ 3 thỏi', initialStock: 25 }],
  },
];

export const banners = [
  {
    name: 'Bộ sưu tập dưỡng da',
    imageUrl: IMG.skincareHero,
    altText: 'Bộ sưu tập dưỡng da LUNELLE',
    linkUrl: '/category/cham-soc-da',
  },
  {
    name: 'Trang điểm tự nhiên',
    imageUrl: IMG.makeup,
    altText: 'Sản phẩm trang điểm tự nhiên LUNELLE',
    linkUrl: '/category/trang-diem',
  },
  {
    name: 'Quà tặng cho người thương',
    imageUrl: IMG.gift,
    altText: 'Bộ quà tặng mỹ phẩm LUNELLE',
    linkUrl: '/category/qua-tang',
  },
];
