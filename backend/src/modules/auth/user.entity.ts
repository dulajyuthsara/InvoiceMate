import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string | null;

  @Index({ unique: true, where: 'phone IS NOT NULL' })
  @Column({ nullable: true })
  phone: string | null;

  @Column({ name: 'business_name' })
  businessName: string;

  @Column({ name: 'tin_number', nullable: true })
  tinNumber: string | null;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'default_language', default: 'en' })
  defaultLanguage: string;

  @Column({ name: 'subscription_tier', default: 'free' })
  subscriptionTier: string;

  @Column({ name: 'wa_phone_id', nullable: true })
  waPhoneId: string | null;

  @Column({ nullable: true, type: 'text' })
  address: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
