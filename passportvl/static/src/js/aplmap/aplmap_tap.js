class Tap
{
	constructor(id,name,isMain,apl)
	{
		this.id=id;
		this.name=name;
		this.isMain=isMain;
		this.apl=apl;
		this.pillarMap={};
		this.transformerMap={};
	}
	
	pushPillar(pillar)
	{
		this.pillarMap[pillar.getID()]=pillar;
	}
	
	getID()
	{
		return this.id;
	}
	
	getSortPillarArrayNum()
	{
		var tempMas=[];
		var minNum=99999;
		for (var i in this.pillarMap)
		{
			if (this.pillarMap[i].getNumByVl()<minNum) minNum=this.pillarMap[i].getNumByVl();
		}
		for (var i in this.pillarMap)
		{
			var pillar=this.pillarMap[i];
			//tempMas.splice(parseInt(pillar.getNumByVl())-1,0,pillar);
			tempMas[pillar.getNumByVl()-minNum]=pillar;
		}
		return tempMas;
	}
	
	getSortJSTSCoords()
	{
		var tempMas=[];
		var minNum=99999;
		var pillarIndex=-1;
		for (var i in this.pillarMap)
		{
			var pillar=this.pillarMap[i];
			if (pillar.getNumByVl()<minNum)
			{
				minNum=pillar.getNumByVl();
				pillarIndex=i;
			}
		}
		if (pillarIndex==-1) return null;
		var startPillar=this.pillarMap[pillarIndex];
		if (startPillar.getInLine()) tempMas.push(startPillar.getInLine().getStartObject().getJSTSCoord());
		tempMas.push(startPillar.getJSTSCoord());
		var outLine=startPillar.getOutLine();
		while (outLine)
		{
			var curObject=outLine.getEndObject();
			tempMas.push(curObject.getJSTSCoord());
			outLine=curObject.getOutLine();
		}
		return tempMas;
	}
	
	pushTransformer(transformer)
	{
		this.transformerMap[transformer.getID()]=transformer;
	}
	
	getWidthSecArea()
	{
		var voltage=this.apl.getVoltage();
		if ((voltage>=6) && (voltage<=20)) return 20;
		if (voltage==35) return 30;
		if (voltage==110) return 40;
		return 0;
	}
	
	getPillarMap()
	{
		return this.pillarMap;
	}
	
	tapIsMain()
	{
		return this.isMain;
	}
	
	getName()
	{
		return this.name;
	}
}