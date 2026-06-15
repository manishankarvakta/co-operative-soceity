import { prisma } from "../lib/db";
import { NotFoundError } from "../backend/errors";

export class NomineeService {
  /**
   * Fetches the nominee details linked to a member.
   */
  static async getNomineeByMemberId(memberId: string) {
    const nominee = await prisma.nominee.findUnique({
      where: { memberId }
    });

    if (!nominee || nominee.deletedAt) {
      throw new NotFoundError("নমিনীর তথ্য খুঁজে পাওয়া যায়নি।");
    }

    return nominee;
  }

  /**
   * Updates standalone nominee details.
   */
  static async updateNominee(
    memberId: string,
    data: {
      name?: string;
      relationship?: string;
      phone?: string;
      address?: string;
      emergencyContact?: string;
    }
  ) {
    const nominee = await prisma.nominee.findUnique({
      where: { memberId }
    });

    if (!nominee || nominee.deletedAt) {
      throw new NotFoundError("নমিনীর তথ্য খুঁজে পাওয়া যায়নি।");
    }

    const result = await prisma.nominee.update({
      where: { memberId },
      data: {
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        address: data.address,
        emergencyContact: data.emergencyContact
      }
    });

    return result;
  }
}
