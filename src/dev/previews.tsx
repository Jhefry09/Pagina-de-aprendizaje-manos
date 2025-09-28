import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import TrainingPage from "@/pages/Training/Page.tsx";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/TrainingPage">
                <TrainingPage/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;