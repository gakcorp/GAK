class PillarIcon
{
	constructor(id, code, pillarType, pillarCut, iconSVG, fillPath, fillColor, strokeWidth,strokeColor)
	{
		this.id=id;
		this.code=code;
		if (pillarType) this.pillarType=pillarType[0];
		else this.pillarType=pillarType;
		if (pillarCut) this.pillarCut=pillarCut[0];
		else this.pillarCut=pillarCut;
		this.iconSVG=iconSVG;
		this.fillPath=fillPath;
		this.fillColor=fillColor;
		this.strokeWidth=strokeWidth;
		this.strokeColor=strokeColor;
		if (this.strokeWidth==0) this.strokeWidth=1;
		if (!this.strokeColor) this.strokeColor=this.fillColor;
		if (!this.fillPath) this.fillColor='none';
	}
}