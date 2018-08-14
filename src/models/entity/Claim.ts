import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";
 @Entity()
export class Claim {
    @PrimaryGeneratedColumn()
    id: number;
     @Column()
    claimID: string;
     @Column()
    claimHash: string;
}