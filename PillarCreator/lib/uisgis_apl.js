class APL
{
    constructor(id, name)
    {
        this.id=id;
        this.name=name;
        this.TapMap=new Map();
    }
    
    pushTap(tap)
    {
        this.TapMap.set(tap.id,tap);
    }
}