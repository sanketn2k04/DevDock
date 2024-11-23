const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');
const {PutObjectCommand, S3Client} =require('@aws-sdk/client-s3');
const mime = require('mime-types')
const Redis = require('ioredis')

const publisher = new Redis('rediss://default:AVNS_5TRv_ucxU-nK6NF_IU6@caching-3aa3cea-bcarry703-dd5b.b.aivencloud.com:11691')


const s3Client=new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
});


const PROJECT_ID=process.env.PROJECT_ID;

function publishLog(log) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }))
}

async function init() {
    console.log("Executing script.js ... ");
    publishLog('Build Started...')
    const outDirPath=path.join(__dirname,'output');

    const process=exec(`cd ${outDirPath} && npm i && npm run build`);

    process.stdout.on('data',(data)=>{
        console.log(data.toString());
        publishLog(data.toString())
    });
    process.stdout.on('error',(data)=>{
        console.log("Error",data.toString());
        publishLog(`error: ${data.toString()}`)
    });
    process.on('close',async ()=>{
        console.log("Build complete!");
        publishLog(`Build Complete`)

        const distFolderPath=path.join(__dirname,'output','dist');
        const distFolderContents=fs.readdirSync(distFolderPath,{recursive:true});

        for(const file of distFolderContents){
            const filePath = path.join(distFolderPath, file)
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log('uploading', filePath)
            publishLog(`uploading ${file}`)
            
            const command = new PutObjectCommand({
                Bucket:"sanket.dev",
                Key:`__outputs/${PROJECT_ID}/${file}`,
                Body:fs.createReadStream(filePath),
                ContentType:mime.lookup(filePath),

            });

            await s3Client.send(command);
            publishLog(`uploaded ${file}`)
            console.log('uploaded', filePath)

        }

        publishLog(`Done`)
        console.log('Done...')

    });
}

init()