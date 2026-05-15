-- CreateTable
CREATE TABLE "discipline" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_total_suspension" BOOLEAN NOT NULL DEFAULT false,
    "member_id" TEXT NOT NULL,

    CONSTRAINT "discipline_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "discipline" ADD CONSTRAINT "discipline_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
