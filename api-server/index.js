const express=require('express');
const {generateSlug}=require('random-word-slugs');
const {ECSClient,RunTaskCommand}=require('@aws-sdk/client-ecs');
const { Server } = require("socket.io");
const Redis = require('ioredis')
const cors = require('cors')

const app=express();
const PORT=9000;

const subscriber = new Redis('rediss://default:AVNS_5TRv_ucxU-nK6NF_IU6@caching-3aa3cea-bcarry703-dd5b.b.aivencloud.com:11691')

const io = new Server({ cors: '*' })
app.use(cors())
app.use(express.json())
io.on('connection', socket => {
    socket.on('subscribe', channel => {
        socket.join(channel)
        socket.emit('message', `Joined ${channel}`)
    })
})

io.listen(9002, () => console.log('Socket Server 9002'))


app.use(express.json());
const ecsClient=new ECSClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
});

const config={
    CLUSTER:'',
    TASK:''
}


app.post('/project',async (req,res)=>{
    
    const {gitURL,slug}=req.body;
    const projectSlug = slug ? slug : generateSlug()

    //spinning Container through API

    const command=new RunTaskCommand({
        cluster:config.CLUSTER,
        taskDefinition:config.TASK,
        launchType:'FARGATE',
        count:1,
        networkConfiguration:{
            awsvpcConfiguration:{
                assignPublicIp:'ENABLED',
                
            }
        },
        overrides:{
            containerOverrides:[
                {
                    name:'builder-image',
                    environment:[
                        {name:'GIT_REPOSITORY_URL',value:gitURL},
                        {name:'PROJECT_ID',value:projectSlug}
                    ]
                }
            ]
        }

    })

    await ecsClient.send(command);

    return res.json({ status:'queued',data:{projectSlug,url:`http://${projectSlug}.localhost:8000`}})


})

async function initRedisSubscribe() {
    console.log('Subscribed to logs....')
    subscriber.psubscribe('logs:*')
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message)
    })
}


initRedisSubscribe()

app.listen(PORT,()=>{
    console.log(`API server running on port no. ${PORT} ...`);
})