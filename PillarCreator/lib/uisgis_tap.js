class Tap
{
    constructor(id, name, specName)
    {
        if (specName) this.name=specName;
        else this.name=name;
        this.id=id;
        this.PillarMap=new Map();
        this.curNum=1;
    }
    
    addPillar(pillar)
    {
        pillar.setNumByVL(this.curNum);
        this.curNum+=1;
        this.PillarMap.set(pillar.num_by_vl,pillar);
    }
    
    sortPillar(firstPillar)
    {
        var pillar;
        if (firstPillar) pillar=firstPillar;
        else pillar=this.PillarMap.get(1);
        this.PillarMap=new Map();
        this.curNum=1;
        while(pillar)
        {
            pillar.setNumByVL(this.curNum);
            this.curNum+=1;
            this.PillarMap.set(pillar.num_by_vl,pillar);
            pillar=pillar.nextPillar;
        }
    }
    
    remove()
    {
        var pillar=this.PillarMap.get(1);
        var tmpArray=[];
        while (pillar)
        {
            tmpArray.push(pillar);
            pillar=pillar.nextPillar;
        }
        for (var i in tmpArray)
        {
            var pillar=tmpArray[i];
            if (pillar.inputLine || pillar.outputLine) pillar.remove();
            
        }
        this.PillarMap=new Map();
        this.curNum=1;
    }
    
    CopyPillarFrom(oldPillarTap)
    {
        if (this.GetPillarsCount()>0)
        {
            alert("Данная отпайка уже содержит другие опоры - сначала удалите их или переместите на другую отпайку");
            return;
        }
        for (var i of oldPillarTap.PillarMap.keys())
        {
            console.log(i);
            var pillar=oldPillarTap.PillarMap.get(i);
            pillar.setPillarTap(this);            
        }
        oldPillarTap.PillarMap=new Map();
    }
    
    GetPillarsCount()
    {
        return this.PillarMap.size;
    }
};