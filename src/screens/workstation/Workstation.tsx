import { useContext, useMemo } from "react"
import Editor from "./Editor"
import { Header, Mixer } from "./components"
import { ChatPanel, PaneResize } from "@/components"
import { WorkstationContext } from "@/contexts"
import { InputPane, PaneResizeData } from "@/components/PaneResize"

export default function Workstation() {
  const { 
    chatPanelWidth, 
    mixerHeight, 
    setAllowMenuAndShortcuts, 
    setChatPanelWidth, 
    setMixerHeight, 
    showChatPanel, 
    showMixer 
  } = useContext(WorkstationContext)!;

  const verticalPanes = useMemo(() => {
    const panes: InputPane[] = [
      {
        key: "editor",
        handle: { style: { height: 2, bottom: -2 } },
        children: <Editor />
      }
    ];

    if (showMixer)
      panes.push({
        key: "mixer", 
        max: 450, 
        min: 229, 
        children: <Mixer />, 
        fixed: true, 
        size: mixerHeight 
      });

    return panes;
  }, [showMixer, mixerHeight]);

  const horizontalPanes = useMemo(() => {
    const panes: InputPane[] = [
      {
        key: "main",
        handle: { style: { width: 2, right: -2 } },
        children: (
          <PaneResize
            direction="vertical"
            onPaneResize={() => setAllowMenuAndShortcuts(false)}
            onPaneResizeStop={handleVerticalPaneResizeStop}
            panes={verticalPanes}
            style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column" }}
          />
        )
      }
    ];

    if (showChatPanel)
      panes.push({
        key: "chat",
        max: 600,
        min: 300,
        children: <ChatPanel />,
        fixed: true,
        size: chatPanelWidth
      });

    return panes;
  }, [verticalPanes, showChatPanel, chatPanelWidth, setAllowMenuAndShortcuts]);

  function handleVerticalPaneResizeStop(data: PaneResizeData) {
    if (data.activeNext)
      setMixerHeight(data.activeNext.size);
    setAllowMenuAndShortcuts(true);
  }

  function handleHorizontalPaneResizeStop(data: PaneResizeData) {
    if (data.activeNext)
      setChatPanelWidth(data.activeNext.size);
    setAllowMenuAndShortcuts(true);
  }

  return (
    <div 
      className="m-0 p-0"
      style={{ width: "100vw", height: "100vh", position: "relative", outline: "none" }}
      tabIndex={0}
    >
      <Header />
      <PaneResize
        direction="horizontal"
        onPaneResize={() => setAllowMenuAndShortcuts(false)}
        onPaneResizeStop={handleHorizontalPaneResizeStop}
        panes={horizontalPanes}
        style={{ flex: 1, height: "calc(100vh - 69px)", display: "flex", flexDirection: "row" }}
      />
    </div>
  )
}