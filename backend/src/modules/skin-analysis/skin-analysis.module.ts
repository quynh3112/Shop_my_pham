import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entity/product.entity';
import { SkinAnalysis } from './entity/skin-analysis.entity';
import { SkinAiService } from './skin-ai.service';
import { SkinAnalysisController } from './skin-analysis.controller';
import { SkinAnalysisService } from './skin-analysis.service';
import { SkinImageStorage } from './skin-image.storage';

@Module({
  imports: [TypeOrmModule.forFeature([SkinAnalysis, Product])],
  controllers: [SkinAnalysisController],
  providers: [SkinAnalysisService, SkinAiService, SkinImageStorage],
})
export class SkinAnalysisModule {}
