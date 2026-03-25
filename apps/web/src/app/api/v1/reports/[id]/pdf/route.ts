import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { withErrorHandling } from "../../../_lib/response";
import { Errors } from "../../../_lib/errors";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/reports/:id/pdf — Download PDF */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("reports")
    .select("pdf_url")
    .eq("id", id)
    .eq("organization_id", auth.orgId)
    .single();

  if (!data?.pdf_url) throw Errors.notFound("PDFレポート");

  // Redirect to the PDF URL (Supabase Storage or S3)
  return NextResponse.redirect(data.pdf_url);
});
