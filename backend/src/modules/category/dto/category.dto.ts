import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên danh mục.' })
  @MaxLength(100)
  name!: string;

  // Slug tự sinh từ tên, trường này được giữ để không lỗi với client cũ
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  /** Danh mục cha, bỏ trống / null = danh mục gốc */
  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống.' })
  @MaxLength(100)
  name?: string;

  /** null = chuyển thành danh mục gốc */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  parentId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
