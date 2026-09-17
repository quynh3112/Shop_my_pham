import { User } from "src/modules/user/entity/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('Adress')
export class Address{
    @PrimaryGeneratedColumn()
    id!:number
    @ManyToOne(()=>User, {onDelete:'CASCADE'})
    @JoinColumn({name:'userId'})
    user!:User
    @Column()
    fullname!:string
    @Column({length:10})
    phone!:string
    @Column()
    line!:string
    @Column()
    ward!:string
    @Column()
    district!:string
    @Column()
    province!:string
    @Column({default:false})
    isDefault!:boolean
    @CreateDateColumn()
    createAt!:Date
    @UpdateDateColumn()
    updateAt!:Date
}