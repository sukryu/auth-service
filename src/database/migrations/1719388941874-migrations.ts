import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1719388941874 implements MigrationInterface {
    name = 'Migrations1719388941874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying(20) NOT NULL, "password" character varying NOT NULL, "created_At" TIMESTAMP NOT NULL DEFAULT now(), "updated_At" TIMESTAMP NOT NULL DEFAULT now(), "deleted_At" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "revoked_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "revoked_token" character varying NOT NULL, "revoked_token_type" character varying NOT NULL, "revoked_reason" character varying NOT NULL, "revoked_at" TIMESTAMP NOT NULL DEFAULT now(), "revoked_by_user_id" uuid, "revoked_from_ip" character varying, CONSTRAINT "UQ_373eef64ad2e652ca614317f3d8" UNIQUE ("revoked_token"), CONSTRAINT "PK_bf300a6daf55d675aba672ba1f7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_373eef64ad2e652ca614317f3d" ON "revoked_token" ("revoked_token") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_373eef64ad2e652ca614317f3d"`);
        await queryRunner.query(`DROP TABLE "revoked_token"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
