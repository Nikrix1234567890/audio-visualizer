import { Editor } from "@/components/Editor";

export default function Home() {
  return (
    // On large screens the editor fills exactly the space under the nav bar
    // and never scrolls as a page; on small screens it stacks and scrolls.
    <div className="flex flex-1 flex-col bg-chassis lg:min-h-0 lg:basis-0 lg:overflow-hidden">
      <Editor />
    </div>
  );
}
