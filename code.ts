figma.showUI(__html__, { width: 300, height: 105 });
const nodeTypes = ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR"];

// const layers = figma.currentPage.findAll((node) =>
//   nodeTypes.includes(node.type)
// );
// figma.currentPage.selection = layers;
const { selection } = figma.currentPage;

figma.ui.onmessage = (msg) => {
  if (msg.type === "set-to-fill") {
    async function setToFill() {
      const nodes: SceneNode[] = [];
      figma.root.children.flatMap((pageNode) =>
        pageNode.selection.forEach(async (node) => {
          if (nodeTypes.includes(node.type)) {
            node.fills.scaleMode = "FILL";
          }
        })
      );
      // shape.resize(900, 400)
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }
    setToFill();
  }
  if (msg.type === "set-to-fit") {
    async function setToFit() {
      const nodes: SceneNode[] = [];
      figma.root.children.flatMap((pageNode) =>
        pageNode.selection.forEach(async (node) => {
          if (nodeTypes.includes(node.type)) {
            node.fills.scaleMode = "FIT";
          }
        })
      );
      // shape.resize(900, 400)
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }
    setToFit();
  }

  figma.closePlugin();
};
