class PillarType
{
    constructor(id, typeName, isBase)
    {
        this.id=id;
        this.name=typeName;
        if (isBase=="True") this.isBase=true;
        else this.isBase=false;
    }
    
    isAngular()
    {
        if (this.name.toLowerCase()=='угловая') return true;
        else return false;
    }
    
    isIntermediate()
    {
        if (this.name.toLowerCase()=='промежуточная') return true;
        else return false;
    }
}