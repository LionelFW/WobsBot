exports.firstAvailableChannel = function(clientChannels, clientUser)
{
    if(Object.prototype.toString.call(clientChannels)!='[object Map]')
    {
        console.log(typeof(clientChannels))
        throw TypeError;
    }
    var clientChannelsArray = clientChannels.array();
    for(i=0;i<clientChannelsArray.length;i++)
    {
        console.log(clientChannelsArray[i]);
    }
    return;
}
