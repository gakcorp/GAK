class PillarIcon
{
    constructor(id, pillarType, pillarCut, svg, strokeThick, strokeColor, contourColor, fillColor)
    {
        this.id=id;
        this.pillarType=pillarType;
        this.pillarCut=pillarCut;
        this.svg=svg;
        this.strokeThick=parseInt(strokeThick);
        this.strokeColor=strokeColor;
        this.contourColor=contourColor;
        this.fillColor=fillColor;
        
        if (this.strokeThick==0) this.strokeThick=1;
        if (!this.pillarType) this.pillarType="-1";
        if (!this.pillarCut) this.pillarCut="-1";
    }
}