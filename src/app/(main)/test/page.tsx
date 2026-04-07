import { redirect } from "next/navigation";

/** /test now redirects to /quiz (consolidated test entry point) */
export default function TestPage() {
  redirect("/quiz");
}
