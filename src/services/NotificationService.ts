import { prisma } from "../lib/db";

export interface DepositReceiptItem {
  type: string;
  amountBdt: number;
}

export class NotificationService {
  // Static array to store sent emails in memory for unit testing assertions
  public static sentEmails: Array<{
    to: string;
    subject: string;
    html: string;
    userId?: string;
  }> = [];

  /**
   * Clears the in-memory array of sent emails. Used in test setup/teardown.
   */
  public static clearSentEmails() {
    this.sentEmails = [];
  }

  /**
   * Generic method to send an email notification, log it to the console,
   * and save it to the database Notification table if linked to a User.
   */
  public static async sendEmail(to: string, subject: string, html: string, userId?: string) {
    // 1. Record email in-memory for unit testing
    this.sentEmails.push({ to, subject, html, userId });

    // 2. Log details to the stdout console
    console.info(`[NotificationService] Sending Email to: ${to}`);
    console.info(`Subject: ${subject}`);
    console.info(`Body Preview: ${html.substring(0, 150)}...`);

    // 3. Save to database Notification table for in-app logs
    if (userId) {
      try {
        const cleanMessage = html
          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "") // strip CSS style tags
          .replace(/<[^>]*>/g, " ") // strip other HTML tags
          .replace(/\s+/g, " ") // normalize spacing
          .trim();

        await prisma.notification.create({
          data: {
            userId,
            title: subject,
            message: cleanMessage,
            read: false
          }
        });
      } catch (err) {
        console.error("[NotificationService] Database persistence failed:", err);
      }
    }
  }

  /**
   * Sends a Deposit Receipt email notification to a member.
   */
  public static async sendDepositReceipt(
    memberEmail: string,
    memberName: string,
    receiptCode: string,
    totalBdt: number,
    items: DepositReceiptItem[],
    userId?: string
  ) {
    const subject = `জমা কালেকশন রশিদ - ${receiptCode}`;

    const itemsTable = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">${item.type}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">
          ${item.amountBdt.toFixed(2)} BDT
        </td>
      </tr>`
      )
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 8px;">সমিতি সঞ্চয় জমা রশিদ</h2>
        <p>প্রিয় <strong>${memberName}</strong>,</p>
        <p>আপনার জমা সফলভাবে গৃহীত হয়েছে। লেনদেন বিবরণী নিচে দেওয়া হলো:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">জমার ধরন (Type)</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">পরিমাণ (Amount)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTable}
            <tr style="font-weight: bold; background-color: #f8fafc;">
              <td style="padding: 8px; border: 1px solid #e2e8f0;">সর্বমোট জমা (Total)</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; color: #10b981; font-family: monospace;">
                ${totalBdt.toFixed(2)} BDT
              </td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
          রশিদ নম্বর: <strong>${receiptCode}</strong><br/>
          তারিখ: ${new Date().toLocaleDateString("bn-BD")}
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;"/>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">সমিতি অর্থ বিভাগ কর্তৃক স্বয়ংক্রিয়ভাবে প্রেরিত।</p>
      </div>
    `.trim();

    await this.sendEmail(memberEmail, subject, html, userId);
  }

  /**
   * Sends a Penalty Notice email notification to a member.
   */
  public static async sendPenaltyNotice(
    memberEmail: string,
    memberName: string,
    amountBdt: number,
    details: string,
    userId?: string
  ) {
    const subject = "জরিমানা চার্জ নোটিশ (Penalty Assessed Notice)";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fca5a5; border-radius: 8px;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">জরিমানা নোটিশ (Penalty Notice)</h2>
        <p>প্রিয় <strong>${memberName}</strong>,</p>
        <p>সমিতির হিসাব বিবরণী পর্যালোচনা করে আপনার অ্যাকাউন্টে একটি জরিমানা ধার্য করা হয়েছে। বিবরণ নিম্নরূপ:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0;">
          <strong>জরিমানার কারণ:</strong> ${details}<br/>
          <strong>জরিমানার পরিমাণ:</strong> <span style="font-family: monospace; font-weight: bold; color: #b91c1c;">${amountBdt.toFixed(2)} BDT</span>
        </div>
        <p>দয়া করে পরবর্তী কালেকশনের সময় এই বকেয়া জরিমানাটি পরিশোধ করে আপনার সদস্য অ্যাকাউন্টটি সচল রাখুন।</p>
        <p style="font-size: 13px; color: #64748b;">
          তারিখ: ${new Date().toLocaleDateString("bn-BD")}
        </p>
        <hr style="border: 0; border-top: 1px solid #fca5a5; margin-top: 25px;"/>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">সমিতি শৃঙ্খলা ও নিয়ন্ত্রণ কমিটি।</p>
      </div>
    `.trim();

    await this.sendEmail(memberEmail, subject, html, userId);
  }

  /**
   * Sends a Suspension Notice email notification to a member.
   */
  public static async sendSuspensionNotice(
    memberEmail: string,
    memberName: string,
    reason: string,
    userId?: string
  ) {
    const subject = "সদস্য অ্যাকাউন্ট স্থগিতকরণ নোটিশ (Suspension Notice)";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f59e0b; border-radius: 8px;">
        <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 8px;">সদস্যপদ স্থগিতকরণ নোটিশ</h2>
        <p>প্রিয় <strong>${memberName}</strong>,</p>
        <p>আপনাকে অত্যন্ত দুঃখের সাথে জানানো যাচ্ছে যে, নিম্নোক্ত কারণে সমিতির নিয়ম অনুযায়ী আপনার সদস্যপদ সাময়িকভাবে স্থগিত করা হয়েছে:</p>
        <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 12px; margin: 15px 0; font-size: 14px;">
          <strong>স্থগিতকরণের কারণ:</strong> ${reason}
        </div>
        <h3 style="color: #d97706; font-size: 15px; margin-top: 20px;">পুনরায় সচল করার নির্দেশনাবলী:</h3>
        <ol style="font-size: 14px; line-height: 1.5; color: #475569;">
          <li>আপনার বকেয়া সকল কিস্তি বা জমা হিসাব সম্পন্ন করুন।</li>
          <li>স্থগিতকরণের জন্য নির্ধারিত ১০% বকেয়া জরিমানা পরিশোধ করুন।</li>
          <li>হিসাব সম্পন্ন হওয়ার পর দায়িত্বপ্রাপ্ত কালেকশন অফিসার আপনার অ্যাকাউন্টটি পুনরায় সচল করে দেবেন।</li>
        </ol>
        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
          তারিখ: ${new Date().toLocaleDateString("bn-BD")}
        </p>
        <hr style="border: 0; border-top: 1px solid #f59e0b; margin-top: 25px;"/>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">সমিতি ব্যবস্থাপনা পরিষদ।</p>
      </div>
    `.trim();

    await this.sendEmail(memberEmail, subject, html, userId);
  }

  /**
   * Sends an Approval Notice email notification for expenses or bank transactions.
   */
  public static async sendApprovalNotice(
    recipientEmail: string,
    type: "EXPENSE" | "BANK_TRANSACTION",
    reference: string,
    amountBdt: number,
    approvedBy: string,
    userId?: string
  ) {
    const typeLabelBN = type === "EXPENSE" ? "ব্যয় বরাদ্দ" : "ব্যাংক লেনদেন";
    const typeLabelEN = type === "EXPENSE" ? "Expense Budget" : "Bank Transaction";
    const subject = `অনুমোদন সম্পন্ন নোটিশ: ${typeLabelBN} (${reference})`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #0284c7; border-radius: 8px;">
        <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px;">লেনদেন অনুমোদন নোটিশ (Approval Notification)</h2>
        <p>সংশ্লিষ্ট কর্মকর্তার অবগতির জন্য জানানো যাচ্ছে যে, নিম্নোক্ত <strong>${typeLabelBN} (${typeLabelEN})</strong> লেনদেনটি সফলভাবে অনুমোদিত হয়েছে:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-weight: bold; width: 40%;">লেনদেনের ধরন</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${typeLabelBN} (${type})</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-weight: bold;">রেফারেন্স নম্বর</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">${reference}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-weight: bold;">টাকার পরিমাণ</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0284c7;">
                ${amountBdt.toFixed(2)} BDT
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-weight: bold;">অনুমোদন করেছেন</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${approvedBy}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-weight: bold;">অনুমোদনের সময়</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date().toLocaleString("bn-BD")}</td>
            </tr>
          </tbody>
        </table>
        <hr style="border: 0; border-top: 1px solid #0284c7; margin-top: 25px;"/>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">সমিতি অডিট ও মনিটরিং বিভাগ।</p>
      </div>
    `.trim();

    await this.sendEmail(recipientEmail, subject, html, userId);
  }
}
