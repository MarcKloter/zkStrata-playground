var connect = require('connect');
var serveStatic = require('serve-static');
var fs = require('fs');
const { parse } = require('querystring');
const exec = require('child_process').exec;

var app = connect();

const port = 3000;

const java = '../../jdk-11/bin/java';
const zkstratac = '../../zkstratac.jar';
const bulletproofs_gadgets_prover = '../../prover';
const bulletproofs_gadgets_verifier = '../../verifier';
const passport_schema = 'passport.schema.json';
const target = 'target';

app.use('/exec', function(req, res){
    if (req.method == 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            let args = parse(body);
            if (args.witness != undefined) {
                prover(args, res);
            } else {
                verifier(args, res);
            }
        });
    }
});

app.use(serveStatic(__dirname)).listen(port, function(){
    console.log(`Server running on ${port}...`);
});

function prover(args, res) {
    if(!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    // create random target directory
    let id;
    let dir;
    do {
        id = Math.floor(Math.random()*16777215).toString(16);
        dir = `${target}/${id}`;
    } while (fs.existsSync(dir));
    fs.mkdirSync(dir);
    let cmd = `cd ${dir}`;

    // copy schema
    fs.copyFile(passport_schema, `${dir}/${passport_schema}`, (err) => {
        if (err) {
            console.log(err);
            res.end(`{"id":"${id}", "success":false, "type":"compilation"}`);
            return;
        };
    });

    // write statement
    let statement = `${id}.zkstrata`;
    fs.writeFileSync(`${dir}/${statement}`, args.statement);
    cmd += ` && ${java} -jar ${zkstratac} --statement ${statement} --schema passport_ch=${passport_schema}`;

    // write witness
    let witness_obj = JSON.parse(args.witness);
    for (const [key, value] of Object.entries(witness_obj)) {
        let witness = `${id}-${key}.json`;
        fs.writeFileSync(`${dir}/${witness}`, JSON.stringify(value));
        cmd += ` --witness-data ${key}=${witness}`;
    }

    // execute zkstratac
    let compile_start = new Date();
    exec(cmd, (err, stdout, stderr) => {
        if(!fs.existsSync(`${dir}/${id}.gadgets`)) {
            console.log(err);
            res.end(`{"id":"${id}", "success":false, "type":"compilation", "message": "${encodeURI(stdout)}"}`);
        }

        let compile_time = new Date() - compile_start;

        // execute prover
        cmd = `cd ${dir} && ${bulletproofs_gadgets_prover} ${id}`;

        let prover_start = new Date();
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
                res.end(`{"id":"${id}", "success":false, "type":"proving"}`);
                return;
            }
    
            let prover_time = new Date() - prover_start;

            var stats = fs.statSync(`${target}/${id}/${id}.proof`);
            var proofSizeInBytes = stats['size'];

            res.end(`{"id":"${id}", "proving_time":${prover_time}, "compilation_time":${compile_time}, "constraints":${stdout}, "proof":${proofSizeInBytes}, "success":true}`);
        });
    });
}

function verifier(args, res) {
    let id = args.statement_id
    let dir = `${target}/${id}`;

    if(!fs.existsSync(dir))
        res.end(`{"id":"${id}", "success":false}`);
    
    let cmd = `cd ${dir}`;

    // execute verifier
    cmd += ` && ${bulletproofs_gadgets_verifier} ${id}`;

    let start = new Date();
    exec(cmd, (err, stdout, stderr) => {
        let time = new Date() - start;
        if (err) {
            console.log(err);
            res.end(`{"id":"${id}", "success":false}`);
            return;
        }
        res.end(`{"id":"${id}", "verification_time":${time}, "success":${stdout}}`);
    });
}
