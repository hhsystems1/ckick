import EditorShell from "@/screens/EditorShell";

export default function EditorPage({ params }: { params: { projectId: string } }) {
  return <EditorShell projectId={params.projectId} />;
}
