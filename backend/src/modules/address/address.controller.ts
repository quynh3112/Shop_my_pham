import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { AddressService } from './address.service';
import { AddressCreateDto } from './dto/create-address.dto';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
	constructor(private readonly addressService: AddressService) {}

	@Get()
	getMyAddresses(@Req() request: any) {
		return this.addressService.listAdrress(request.user.userId);
	}

	@Post()
	createAddress(@Body() body: AddressCreateDto, @Req() request: any) {
		return this.addressService.createAddress(request.user.userId, body);
	}

	@Patch(':id')
	updateAddress(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: AddressCreateDto,
		@Req() request: any,
	) {
		return this.addressService.updateAddress(request.user.userId, id, body);
	}

	@Patch(':id/default')
	setDefaultAddress(
		@Param('id', ParseIntPipe) id: number,
		@Req() request: any,
	) {
		return this.addressService.setDefaultAddress(request.user.userId, id);
	}

	@Delete(':id')
	removeAddress(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
		return this.addressService.removeAddress(request.user.userId, id);
	}
}
