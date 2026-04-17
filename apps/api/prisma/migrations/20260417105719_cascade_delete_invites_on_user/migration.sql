-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_invited_by_id_fkey";

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
