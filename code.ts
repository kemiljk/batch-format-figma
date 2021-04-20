figma.showUI(__html__, { width: 300, height: 320 });
const nodeTypes = ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR"];

const { selection } = figma.currentPage;

function clone(val) {
  return JSON.parse(JSON.stringify(val));
}

figma.ui.onmessage = (msg) => {
  // const messages = {
  //   type: ["set-to-fill", "set-to-fit", "set-to-crop", "set-to-tile"],
  //   scaleMode: ["FILL", "FIT", "CROP", "TILE"],
  // };

  // messages.type.forEach((index) => {
  //   const images = figma.currentPage.selection;
  //   console.log(messages.type + index);
  //   if (messages.type.includes(msg.type)) {
  //     for (msg.type in messages)
  //       figma.root.children.flatMap((pageNode) =>
  //         pageNode.selection.forEach(async (node) => {
  //           if (nodeTypes.includes(node.type)) {
  //             node.fills = node.fills.map((p) =>
  //               p.type === "IMAGE"
  //                 ? { ...p, scaleMode: messages.scaleMode[index] }
  //                 : p
  //             );
  //             node.resize(msg.widthCount, msg.heightCount);
  //           }
  //         })
  //       );
  //   }
  //   figma.notify(`Set ${images.length} images to ${messages.scaleMode}`);
  // });

  if (msg.type === "remove-fill-layer") {
    async function removeFillLayer() {
      figma.root.children.flatMap((pageNode) =>
        pageNode.selection.forEach(async (node) => {
          const fills = clone(node.fills);
          if (fills.length >= 2) {
            if (node.type !== "IMAGE") {
              fills.splice(0, 1);
              node.fills = fills;
            }
          }
        })
      );
    }
    removeFillLayer();
  }
};

figma.ui.onmessage = (msg) => {
  if (msg.type === "set-to-fill") {
    const images = figma.currentPage.selection;
    async function setToFill() {
      figma.root.children.flatMap((pageNode) =>
        pageNode.selection.forEach(async (node) => {
          if (nodeTypes.includes(node.type)) {
            node.fills = node.fills.map((p) =>
              p.type === "IMAGE" ? { ...p, scaleMode: "FILL" } : p
            );
            node.resize(msg.widthCount, msg.heightCount);
          }
        })
      );
    }
    setToFill();
    figma.notify(`Set ${images.length} images to FILL`);
  }
  if (msg.type === "set-to-fit") {
    const images = figma.currentPage.selection;
    async function setToFit() {
      figma.root.children.flatMap((pageNode) =>
        pageNode.selection.forEach(async (node) => {
          if (nodeTypes.includes(node.type)) {
            node.fills = node.fills.map((p) =>
              p.type === "IMAGE" ? { ...p, scaleMode: "FIT" } : p
            );
            node.resize(msg.widthCount, msg.heightCount);
          }
        })
      );
    }
    setToFit();
    figma.notify(`Set ${images.length} images to FIT`);
  }
  if (msg.type === "set-to-crop") {
    const images = figma.currentPage.selection;
    async function setToCrop() {
      figma.root.children.flatMap((pageNode) =>
        pageNode.selection.forEach(async (node) => {
          if (nodeTypes.includes(node.type)) {
            node.fills = node.fills.map((p) =>
              p.type === "IMAGE" ? { ...p, scaleMode: "CROP" } : p
            );
            node.resize(msg.widthCount, msg.heightCount);
          }
        })
      );
    }
    setToCrop();
    figma.notify(`Set ${images.length} images to CROP`);
  }
  if (msg.type === "set-to-tile") {
    const images = figma.currentPage.selection;
    async function setToTile() {
      figma.root.children.flatMap((pageNode) =>
        pageNode.selection.forEach(async (node) => {
          if (nodeTypes.includes(node.type)) {
            node.fills = node.fills.map((p) =>
              p.type === "IMAGE" ? { ...p, scaleMode: "TILE" } : p
            );
            node.resize(msg.widthCount, msg.heightCount);
          }
        })
      );
    }
    setToTile();
    figma.notify(`Set ${images.length} images to TILE`);
  }

  if (msg.type === "remove-fill-layer") {
    async function removeFillLayer() {
      figma.root.children.flatMap((pageNode) =>
        pageNode.selection.forEach(async (node) => {
          const fills = clone(node.fills);
          if (fills.length >= 2) {
            if (node.type !== "IMAGE") {
              fills.splice(0, 1);
              node.fills = fills;
            }
          }
        })
      );
    }
    removeFillLayer();
  }
};
