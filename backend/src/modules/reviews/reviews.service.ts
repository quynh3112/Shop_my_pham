import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { Review } from './entity/review.entity';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { Order, PaymentStatus } from '../order/entity/order.entity';
import { OrderStatus } from 'src/until/order_status';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async findAll(): Promise<Review[]> {
    return this.reviewRepo.find({
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    return review;
  }

  private async assertUserCanReviewProduct(userId: number, productId: number) {
    const hasPurchased = await this.orderItemRepo
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .where('orderItem.productId = :productId', { productId })
      .andWhere('order.userId = :userId', { userId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatus.PAID,
      })
      .getExists();

    if (!hasPurchased) {
      throw new BadRequestException(
        'Chỉ có thể đánh giá sản phẩm sau khi bạn đã mua và nhận hàng thành công.',
      );
    }
  }

  async create(data: CreateReviewDto): Promise<Review> {
    const userId = data.userId;
    if (!userId) {
      throw new BadRequestException('userId là bắt buộc.');
    }

    const [user, product] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.productRepo.findOne({ where: { id: data.productId } }),
    ]);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm.');
    }

    await this.assertUserCanReviewProduct(userId, data.productId);

    const existingReview = await this.reviewRepo.findOne({
      where: { userId, productId: data.productId },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi.');
    }

    const review = this.reviewRepo.create({
      userId,
      productId: data.productId,
      rating: data.rating,
      comment: data.comment ?? null,
    });

    return this.reviewRepo.save(review);
  }

  async update(id: number, data: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    if (data.rating !== undefined) {
      review.rating = data.rating;
    }

    if (data.comment !== undefined) {
      review.comment = data.comment ?? null;
    }

    const targetProductId = data.productId ?? review.productId;
    const targetUserId = data.userId ?? review.userId;

    if (data.productId !== undefined || data.userId !== undefined) {
      const [product, user] = await Promise.all([
        this.productRepo.findOne({ where: { id: targetProductId } }),
        this.userRepo.findOne({ where: { id: targetUserId } }),
      ]);

      if (!product) {
        throw new NotFoundException('Không tìm thấy sản phẩm.');
      }

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng.');
      }

      await this.assertUserCanReviewProduct(targetUserId, targetProductId);
      review.productId = targetProductId;
      review.userId = targetUserId;
    }

    return this.reviewRepo.save(review);
  }

  async remove(id: number): Promise<{ deleted: boolean; id: number }> {
    const review = await this.reviewRepo.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    await this.reviewRepo.remove(review);
    return { deleted: true, id };
  }
}
