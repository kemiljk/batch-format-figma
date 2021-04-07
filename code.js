var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { width: 300, height: 105 });
const nodeTypes = ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR"];
// const layers = figma.currentPage.findAll((node) =>
//   nodeTypes.includes(node.type)
// );
// figma.currentPage.selection = layers;
const { selection } = figma.currentPage;
figma.ui.onmessage = (msg) => {
    if (msg.type === "set-to-fill") {
        function setToFill() {
            return __awaiter(this, void 0, void 0, function* () {
                const nodes = [];
                figma.root.children.flatMap((pageNode) => pageNode.selection.forEach((node) => __awaiter(this, void 0, void 0, function* () {
                    if (nodeTypes.includes(node.type)) {
                        node.fills.scaleMode = "FILL";
                    }
                })));
                // shape.resize(900, 400)
                figma.currentPage.selection = nodes;
                figma.viewport.scrollAndZoomIntoView(nodes);
            });
        }
        setToFill();
    }
    if (msg.type === "set-to-fit") {
        function setToFit() {
            return __awaiter(this, void 0, void 0, function* () {
                const nodes = [];
                figma.root.children.flatMap((pageNode) => pageNode.selection.forEach((node) => __awaiter(this, void 0, void 0, function* () {
                    if (nodeTypes.includes(node.type)) {
                        node.fills.scaleMode = "FIT";
                    }
                })));
                // shape.resize(900, 400)
                figma.currentPage.selection = nodes;
                figma.viewport.scrollAndZoomIntoView(nodes);
            });
        }
        setToFit();
    }
    figma.closePlugin();
};
