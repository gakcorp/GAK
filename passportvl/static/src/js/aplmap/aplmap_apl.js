class Apl
{
	constructor(id,name,voltage)
	{
		this.id=id;
		this.name=name;
		this.voltage=voltage;
		this.tapMap={};
		this.pillarMap={};
		this.transformerMap={};
	}
	
	pushPillar(pillar)
	{
		this.pillarMap[pillar.getID()]=pillar;
	}
	
	pushTap(tap)
	{
		this.tapMap[tap.getID()]=tap;
	}
	
	pushTransformer(transformer)
	{
		this.transformerMap[transformer.getID()]=transformer;
	}
	
	getVoltage()
	{
		return this.voltage;
	}
}