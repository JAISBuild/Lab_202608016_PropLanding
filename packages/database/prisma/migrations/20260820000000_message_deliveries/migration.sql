-- CreateTable
CREATE TABLE "message_deliveries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "inquiry_id" TEXT,
    "appointment_id" TEXT,
    "channel" TEXT NOT NULL,
    "method_label" TEXT NOT NULL,
    "template_key" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "provider_msg_id" TEXT,
    "error_message" TEXT,
    "payload" JSONB,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "message_delivery_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_deliveries_organization_id_created_at_idx" ON "message_deliveries"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "message_deliveries_inquiry_id_channel_idx" ON "message_deliveries"("inquiry_id", "channel");

-- CreateIndex
CREATE INDEX "message_deliveries_status_created_at_idx" ON "message_deliveries"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notification_logs_message_delivery_id_created_at_idx" ON "notification_logs"("message_delivery_id", "created_at");

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_message_delivery_id_fkey" FOREIGN KEY ("message_delivery_id") REFERENCES "message_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
