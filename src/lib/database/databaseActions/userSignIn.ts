"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/app/auth";
import getUserByEmail from "./getUserByEmail";
import { request } from "./twoFactorManager";
import { DocumentData } from "firebase-admin/firestore";
import { UserDataType, UserCredintialType, StatusType } from "@/types/types";
import MessageList from "@/lib/MessagesList.json";



interface ExtendedDocumentData extends DocumentData, UserDataType{};

export default async function userSignIn(credential: UserCredintialType) {
    
    const userDocRef = await getUserByEmail(credential.username);

    if (!userDocRef?.exists) return {
        status: "error",
        message: MessageList.M003.message,
    } as StatusType;

    const userData = userDocRef.data() as ExtendedDocumentData;

    if (userData.loginInfo.isSuspended) return {
        status: "error",
        message: MessageList.M022.message,
    } as StatusType;

    if (userData.loginInfo.twoFactor.isEnabled) return await request(userData) as StatusType;

    try {
        await signIn("credentials", {
          ...credential,
          redirect: false
        })
      } catch (error) {
        if (error instanceof AuthError) {
          switch (error.type) {
            case "CredentialsSignin":
                return {
                    status: "error",
                    message: MessageList.M021.message,
                } as StatusType;
            default:
                return {
                    status: "error",
                    message: MessageList.M009.message,
                } as StatusType;
          }
        }
    }

    return {
        status: "authenticated",
        message: MessageList.M001.message,
    } as StatusType;
}