"use server";

import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";

import { CreateComment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { comment, cardId } = data;
  let commentdata;

  try {

    commentdata = await db.comment.create({
      data: {
        comment,
        cardId
      },
    });

    await createAuditLog({
      entityId: cardId,
      entityTitle: commentdata.comment,
      entityType: ENTITY_TYPE.COMMENT,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return {
      error: "Failed to create comment."
    }
  }

  revalidatePath(`/board/${cardId}`);
  return { data: commentdata };
};

export const createComment = createSafeAction(CreateComment, handler);
