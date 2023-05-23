import React, { useState,useRef } from 'react';
import { saveAs } from 'file-saver';


function  Apik6 () {
  const [url, setUrl] = useState('');
  const [numUsers, setNumUsers] = useState();
  const [duration, setDuration] = useState('');
  const[iterations,setIterations]= useState('');
//   const[statTime, setstatTime]=useState('');
  const [gracefulRampDown,setgracefulRampdown]=useState('');
  const [startVUs,setStartVus]=useState('');
  const [startRate,setStartRate]= useState('');
  const [rate,setRate]= useState('');
  const [timeUnit,settimeUnit]= useState('');
  const [preAllocatedvus, setpreAllocatedvus]=useState('');
  const [maxVus,setmaxVus]=useState('');
  const [threshold, setThreshold] = useState('');
  const [sleepTime, setSleepTime] = useState();
  const [k6Script, setK6Script] = useState('');
  const [expectedResponse, setExpectedResponse]= useState('');
  const [httpMethod, setHttpMethod] = useState('');
  const [payload, setPayload] = useState([{ key: '', value: '' }]);
  const [option, setOption] = useState('');
  const [stages, setStages] = useState([{ dur: '', target: '' }]);
  const [copied, setCopied] = useState(false);
  const [exportFilename, setExportFilename] = useState('');

  const k6ScriptRef = useRef(null);


  function handleSubmit(e) {
    e.preventDefault();

    // Check if mandatory fields are filled
    if (
        !url ||
        (option === 'LOAD' && (numUsers < 1 || duration <= '0')) ||
        (option === 'RAMP' && stages.some(item => !item.dur || !item.target)) ||
        (option === 'SHARED-Iterations' && (numUsers <=1 ||  iterations <= 0 || duration<='0')) ||
        (option === 'Per-Vu-Iterations' && (numUsers <=1 ||  iterations <= 0 || duration<='0')) ||
        (option === 'Constant-vus' && (numUsers <=1 || duration<='0')) ||
        (option === 'Ramping-vus' &&  stages.some(item => !item.dur || !item.target)) ||
        (option === 'Constant-arrival-rate' && (rate <=1 || duration<='0' || timeUnit<=0|| preAllocatedvus<=0 || maxVus<=0)) ||
        (option === 'Ramping-arrival-rate' && (startRate <=1 || timeUnit<=0|| preAllocatedvus<=0 )&&( stages.some(item => !item.dur || !item.target))) ||
        (httpMethod === 'POST' && payload.some(item => !item.key || !item.value || !item.type)) ||
        (httpMethod === 'PUT' && payload.some(item => !item.key || !item.value || !item.type)) || !httpMethod
      ) {
        alert('Please fill in all the mandatory fields');
        return;
      }
    


  
    // Generate k6 script based on user inputs
    let k6Script = `
import http from 'k6/http';
import { check,sleep } from 'k6';

export let options = {`;

    if (option === 'LOAD') {
      k6Script += `
      vus: ${numUsers},
      duration: '${duration}',`;
    } else if(option==='RAMP') {
      k6Script += `
      stages: [`;

      stages.forEach((item, index) => {
        k6Script += `
        { duration: '${item.dur}s', target: ${item.target} }`;
        if (index < stages.length - 1) {
          k6Script += ',';
        }
      });

      k6Script += `
      ],`;
    }else if(option==='SHARED-Iterations'){
        k6Script+=`
        scenarios:{
            shared_iterations: {
                executor: 'shared-iterations',
                vus: ${numUsers},
                iterations: ${iterations},
                maxDuration: '${duration}s'
            }
        }
            ,`
    }else if(option==='Per-Vu-iterations'){
        k6Script+=`
        scenarios:{
            per_vu_iterations: {
                executor: 'per-vu-iterations',
                vus: ${numUsers},
                iterations: ${iterations},
                maxDuration: '${duration}s'
            }
        },`
    }else if(option==='Constant-vus'){
        k6Script+=`
        scenarios:{
            constant_vus{
                executor: 'constant-vus',
            vus: ${numUsers},
            duration: '${duration}s'
            }  
        },`
    }else if(option==='Ramping-vus'){
        k6Script += `
            scenarios:{
              ramping_vus: {
                executor: 'ramping-vus',
              startVUs: ${startVUs},
              gracefulRampDown: '${gracefulRampDown}s',
            stages: [`;
          
          stages.forEach((item, index) => {
            k6Script += `
              { duration: '${item.dur}s', target: ${item.target} }`;
            if (index < stages.length - 1) {
              k6Script += ',';
            }
          });
          
          k6Script += `
            ]
          }
              }`;
          
    }else if(option==='Constant-arrival-rate'){
        k6Script+=`scenarios:{
            constant_arrival_rate: {
                executor: 'constant-arrival-rate',
                duration: '${duration}s',
                rate: ${rate},
                timeUnit: '${timeUnit}m',
                preAllocatedVUs: ${preAllocatedvus},
                maxVUs: ${maxVus},
            },
        },`
    }else if(option==='Ramping-arrival-rate'){
        k6Script+=`
            scenarios: {
             ramping_arrival_rate: {
                executor: "ramping-arrival-rate",
                startRate: ${startRate},
                timeUnit: '${timeUnit}m',
                preAllocatedVUS: ${preAllocatedvus},
                stages: [`;
                    stages.forEach((item, index) => {
                    k6Script += `
                        { duration: '${item.dur}s', target: ${item.target} }`;
                        if (index < stages.length - 1) {
                        k6Script += ',';
                        }
                    });

                    k6Script += `
                ]
            },
        }`
    }
    k6Script += `
    };
  
export default function () {
        `;
        if (httpMethod === 'POST' || httpMethod === 'PUT') {
          k6Script += `
  const payloadData =JSON.stringify( {`;
    
          payload.forEach((item, index) => {
            k6Script += `
              ${item.key}: ${item.type === "string" ? `"${item.value}"` : `"${item.value}"`}`;
            if (index < payload.length - 1) {
              k6Script += ",";
            }
          });
    
          k6Script += `
            };
          `;
        }
      
        k6Script += ` 
  const url = '${url}';
        `;
        
        if (httpMethod === 'GET') {
            k6Script += `
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const res = http.get(url,params);
            `;
        } else if (httpMethod === 'POST') {
          k6Script += `
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const res = http.post(url, payloadData, params);
          `;
        }  else if (httpMethod === 'PUT') {
          k6Script += `
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const res = http.put('${url}', payloadData, params);
          `;
        } else if (httpMethod === 'DELETE') {
          k6Script += `
  const res = http.del('${url}');
          `;
        }

        k6Script += `
  check(res, {'Status code is 200': (r) => r.status === 200});
        `;
  
    if (expectedResponse !== '') {
      k6Script += `
  check(res, {'Response body contains expected string': (r) => r.body.includes('${expectedResponse}')});`;
    }

    k6Script += `
  sleep(${sleepTime});
      }`;
  
    // Display generated k6 script to user
    setK6Script(k6Script);
  }
  function handleStageChange(index, field, newValue) {
    const newStages = [...stages];
    newStages[index][field] = newValue;
    setStages(newStages);
  }

  function handleAddStagePair() {
    setStages([...stages, { dur: '', target: '' }]);
  }

  function handleRemoveStagePair(index) {
    if (index > 0) {
      const newStages = [...stages];
      newStages.splice(index, 1);
      setStages(newStages);
    }
  }


function handlePayloadChange(index, field, newValue) {
  const newPayload = [...payload];
  newPayload[index][field] = newValue;
  setPayload(newPayload);
}

function handleAddPayloadPair() {
  setPayload([...payload, { key: "", value: "", type: "string" }]);
}

function handleRemovePayloadPair(index) {
  const newPayload = [...payload];
  newPayload.splice(index, 1);
  setPayload(newPayload);
}
function handleCopyScript() {
    const textarea = k6ScriptRef.current;
    textarea.select();
    document.execCommand('copy');
    setCopied(true);
  }

  function handleExportScript() {
    if (!k6Script) {
      return;
    }
  
    if (!exportFilename) {
      alert('Please enter a filename');
      return;
    }
    const fileNameWithExtension = exportFilename.endsWith('.js')
    ? exportFilename
    : exportFilename + '.js';
  
    const blob = new Blob([k6Script], { type: 'application/javascript;charset=utf-8' });
  saveAs(blob, fileNameWithExtension);
  setExportFilename('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4 text-red-500">Load Test Parameters - API</h2>

        <div className="mb-4">
          <label htmlFor="url" className="block text-gray-700 font-bold mb-2">Website API:*</label>
          <input
            type="text"
            id="url"
            name="url"
            placeholder="Enter the URL"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          />
        </div>

        <div className="mb-4 ">
  <label htmlFor="option" className="block text-gray-700 font-bold mb-2">Options:</label>
  <select
    id="option"
    name="options"
    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
    value={option}
    onChange={(e) => setOption(e.target.value)}
  >
    <option value="">Select an option Method</option>
    <option class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="LOAD">Concurrent Users</option>
    <option class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="RAMP">User Interval</option>
    <option class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="SHARED-Iterations">Shared Iterations</option>
    <option class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="Per-Vu-iterations">Per Vu-Iterations</option>
    <option class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="Constant-vus">Constant-vus</option>
    <option class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="Ramping-vus">Ramping-VUs</option>
    <option class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="Constant-arrival-rate">Constant-Arrival-Rate</option>
    <option class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="Ramping-arrival-rate">Ramping-Arrival-Rate</option>
  </select>
</div>

        {option === 'LOAD' && (
          <div className="mb-2 flex items-center">
            <div className="mb-4">
            <div className='mr-2'>
            <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">No.Of Users:*</label>
              <input
                type="number"
                id="numUsers" placeholder='Concurrent Users'
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="numUsers"
                required
                min="0"
                value={numUsers}
                onChange={(e) => setNumUsers(e.target.value)}
              />
            </div>
            </div>

            <div className="mb-4">
           <div className='"mr-2'>
           <label htmlFor="duration"class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Duration :*</label>
              <input
                type="number"
                id="duration"
                placeholder="In Seconds"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="duration"
                required
                min="10"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />

           </div>
            </div>
          </div>
        )}

{option === 'RAMP' && (
  <div className="mb-4">
    <label htmlFor="stages" className="block text-gray-700 font-bold mb-2">Stages:</label>
    {stages.map((item, index) => (
      <div key={index} className="mb-2 flex items-center">
        <div className="mr-2">
          <label htmlFor="duration" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Duration:*</label>
          <input
            type="number"
            min={0}
            placeholder="In Seconds"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-xs"
            value={item.dur}
            required
            onChange={(e) => handleStageChange(index, 'dur', e.target.value)}
          />
        </div>
        <div className="mr-2">
          <label htmlFor="duration" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Target:*</label>
          <input
            type="number"
            min={0}
            placeholder="Number of Concurrent Users"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            value={item.target}
            required
            onChange={(e) => handleStageChange(index, 'target', e.target.value)}
          />
        </div>
        {index >= 1 && (
          <button
            type="button"
            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
            onClick={() => handleRemoveStagePair(index)}
          >
            -
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      className="btn-add-stage focus:outline-none bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm px-5 py-2.5"
      onClick={handleAddStagePair}
    >
      +
    </button>
  </div>
)}
    {option==='SHARED-Iterations' &&(
         <div className="mb-2 flex items-center">
            <div className="mb-4">
            <div className='mr-2'>
            <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">No.Of Users:*</label>
              <input
                type="number"
                id="numUsers" placeholder='Concurrent Users'
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="numUsers"
                required
                min="0"
                value={numUsers}
                onChange={(e) => setNumUsers(e.target.value)}
              />
            </div>
            </div>
         <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Iterations</label>
           <input
             type="number"
             id="iterations" placeholder='iterations'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="iterations"
             required
             min="0"
             value={iterations}
             onChange={(e) => setIterations(e.target.value)}
           />
         </div>
         </div>
         <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">MaxDuration:</label>
           <input
             type="number"
             id="StatTime" placeholder='in Seconds'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="iterations"
             required
             min="0"
             value={duration}
             onChange={(e) => setDuration(e.target.value)}
           />
         </div>
         </div>

         </div>
    )}
    {option==='Per-Vu-iterations' &&(
         <div className="mb-2 flex items-center">
            <div className="mb-4">
            <div className='mr-2'>
            <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">No.Of Users:*</label>
              <input
                type="number"
                id="numUsers" placeholder='Concurrent Users'
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="numUsers"
                required
                min="0"
                value={numUsers}
                onChange={(e) => setNumUsers(e.target.value)}
              />
            </div>
            </div>
         <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Iterations :</label>
           <input
             type="number"
             id="iterations" placeholder='iterations'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="iterations"
             required
             min="0"
             value={iterations}
             onChange={(e) => setIterations(e.target.value)}
           />
         </div>
         </div>
         <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">MaxDuration :</label>
           <input
             type="number"
             id="StatTime" placeholder='InSeconds'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="maxDuration"
             required
             min="0"
             value={duration}
             onChange={(e) => setDuration(e.target.value)}
           />
         </div>
         </div>

         </div>
    )}
    {option==='Constant-vus' &&(
         <div className="mb-2 flex items-center">
            <div className="mb-4">
            <div className='mr-2'>
            <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">No.Of Users:*</label>
              <input
                type="number"
                id="numUsers" placeholder='Concurrent Users'
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="numUsers"
                required
                min="0"
                value={numUsers}
                onChange={(e) => setNumUsers(e.target.value)}
              />
            </div>
            </div>
         
         <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="numUsers" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Duration :</label>
           <input
             type="number"
             id="StatTime" placeholder='InSeconds'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="maxDuration"
             required
             min="0"
             value={duration}
             onChange={(e) => setDuration(e.target.value)}
           />
         </div>
         </div>

         </div>
    )}
    {option === 'Ramping-vus' && (
  <div className="mb-4">
     <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="StartVus" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">StartVus :</label>
           <input
             type="number"
             id="StatTime" placeholder='Concurrent Users'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="maxDuration"
             required
             min="0"
             value={startVUs}
             onChange={(e) => setStartVus(e.target.value)}
           />
         </div>
         </div>
         <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="gracefulRamp" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Graceful RampDown :</label>
           <input
             type="number"
             id="StatTime" placeholder='rampDown in seconds'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="maxDuration"
             required
             min="0"
             value={gracefulRampDown}
             onChange={(e) => setgracefulRampdown(e.target.value)}
           />
         </div>
         </div>
         
    <label htmlFor="stages" className="block text-gray-700 font-bold mb-2">Stages:</label>
    {stages.map((item, index) => (
      <div key={index} className="mb-2 flex items-center">
        <div className="mr-2">
          <label htmlFor="duration" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Duration:*</label>
          <input
            type="number"
            min={0}
            placeholder="In Seconds"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-xs"
            value={item.dur}
            required
            onChange={(e) => handleStageChange(index, 'dur', e.target.value)}
          />
        </div>
        <div className="mr-2">
          <label htmlFor="duration" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Target:*</label>
          <input
            type="number"
            min={0}
            placeholder="Number of Concurrent Users"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            value={item.target}
            required
            onChange={(e) => handleStageChange(index, 'target', e.target.value)}
          />
        </div>
        {index >= 1 && (
          <button
            type="button"
            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
            onClick={() => handleRemoveStagePair(index)}
          >
            -
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      className="btn-add-stage focus:outline-none bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm px-5 py-2.5"
      onClick={handleAddStagePair}
    >
      +
    </button>
  </div>
)}
{option === 'Constant-arrival-rate' && (
          <div className="mb-4">
            <div className="mr-2 flex items-center">
            <div className="mb-4">
           <div className='"mr-2'>
           <label htmlFor="duration"class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Duration :*</label>
              <input
                type="number"
                id="duration"
                placeholder="In Seconds"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="duration"
                required
                min="10"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
           </div>
            </div>
            <div className="mb-4">
           <div className='"mr-2'>
           <label htmlFor="rate"class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Rate:*</label>
              <input
                type="number"
                id="duration"
                placeholder="rate"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="rate"
                required
                min="10"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
           </div>
            </div>
            <div className="mb-4">
           <div className='"mr-2'>
           <label htmlFor="timeUnit"class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">TimeUnit:</label>
              <input
                type="number"
                id="timeUnit"
                placeholder="In Minutes"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="duration"
                required
                min="0"
                value={timeUnit}
                onChange={(e) => settimeUnit(e.target.value)}
              />
           </div>
            </div>
            </div>
            <div className="mr-2 flex items-center">
            <div className="mb-4">
           <div className='"mr-2'>
           <label htmlFor="preAllocatedVus"class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">PreAllocated VU's :*</label>
              <input
                type="number"
                id="preallocatedvus"
                placeholder="no.of users"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="duration"
                required
                min="10"
                value={preAllocatedvus}
                onChange={(e) => setpreAllocatedvus(e.target.value)}
              />
           </div>
            </div>
            <div className="mb-4">
           <div className='"mr-2'>
           <label htmlFor="maxVus"class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Max Vus :*</label>
              <input
                type="number"
                id="maxVus"
                placeholder="Max Users"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                name="maxVus"
                required
                min="10"
                value={maxVus}
                onChange={(e) => setmaxVus(e.target.value)}
              />
           </div>
            </div>
            </div> 
          </div>
        )}
        {option === 'Ramping-arrival-rate' && (
  <div className="mb-4">
    <div className="mb-2 flex items-center">
    <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="StartRate" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">StartRate :</label>
           <input
             type="number"
             id="StatTime" placeholder='Start Rate'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="startRate"
             required
             min="0"
             value={startRate}
             onChange={(e) => setStartRate(e.target.value)}
           />
         </div>
         </div>
    
     <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="MaxVus" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">TimeUnit :</label>
           <input
             type="number"
             id="TImeUnit" placeholder='TimeUnit'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="TimeUnit"
             required
             min="0"
             value={timeUnit}
             onChange={(e) => settimeUnit(e.target.value)}
           />
         </div>
         </div>
         </div>
         <div className="mb-2 flex items-center">
         <div className="mb-4">
         <div className='mr-2'>
         <label htmlFor="preAllocatedVus" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">PreAllocated Vus :</label>
           <input
             type="number"
             id="StatTime" placeholder='PreAllocated Users'
             className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
             name="PreAllocated"
             required
             min="0"
             value={preAllocatedvus}
             onChange={(e) => setpreAllocatedvus(e.target.value)}
           />
         </div>
         </div>
         </div>

    <label htmlFor="stages" className="block text-gray-700 font-bold mb-2">Stages:</label>
    {stages.map((item, index) => (
      <div key={index} className="mb-2 flex items-center">
        <div className="mr-2">
          <label htmlFor="duration" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Duration:*</label>
          <input
            type="number"
            min={0}
            placeholder="In Seconds"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-xs"
            value={item.dur}
            required
            onChange={(e) => handleStageChange(index, 'dur', e.target.value)}
          />
        </div>
        <div className="mr-2">
          <label htmlFor="duration" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Target:*</label>
          <input
            type="number"
            min={0}
            placeholder="Number of Concurrent Users"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            value={item.target}
            required
            onChange={(e) => handleStageChange(index, 'target', e.target.value)}
          />
        </div>
        {index >= 1 && (
          <button
            type="button"
            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
            onClick={() => handleRemoveStagePair(index)}
          >
            -
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      className="btn-add-stage focus:outline-none bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm px-5 py-2.5"
      onClick={handleAddStagePair}
    >
      +
    </button>
  </div>
)}


    <label htmlFor='httpMethod'className="block text-gray-700 font-bold mb-2">HTTP Method:</label>
<select
  id='httpMethod'
  name='httpMethod'
  value={httpMethod}
  onChange={(e) => setHttpMethod(e.target.value)}
  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
>
  <option value="">Select an HTTP option</option>
  <option value='GET'>GET</option>
  <option value='POST'>POST</option>
  <option value='PUT'>PUT</option>
  <option value='DELETE'>DELETE</option>
</select>
<br />
{['POST', 'PUT', 'DELETE'].includes(httpMethod) && (
  <div className="mb-4">
    <label htmlFor="stages" className="block text-gray-700 font-bold mb-2">Payload:</label>
    {payload.map((item, index) => (
      <div key={index} className="mb-2 flex items-center">
       <div className="mr-2">
       <label htmlFor="key" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Key:</label>
       <input
          type="text"
          placeholder="Key"
          value={item.key}
          className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-xs"
          onChange={(e) => handlePayloadChange(index, "key", e.target.value)}
        />
        </div>
        <div className="mr-2">
        <label htmlFor="duration" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Value:</label>
        <input
          type="text"
          placeholder="Value"
          value={item.value}
          onChange={(e) => handlePayloadChange(index, "value", e.target.value)}
          className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-xs"
        />
        </div>
       <div  className="mr-2">
       <label htmlFor="option" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Type:</label>
  <select
    value={item.type}
    onChange={(e) => handlePayloadChange(index, "type", e.target.value)}
    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
  >
    <option value="">Type of Value</option>
    <option className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="string">String</option>
    <option className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" value="integer">Integer</option>
  </select>
        </div>
        {index >= 0 && (
          <button
          type="button"
          className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
          onClick={() => handleRemovePayloadPair(index)}
        >
          -
        </button>
        )}
      </div>
    ))}
    <button
      type="button"
      className="btn-add-stage focus:outline-none bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm px-5 py-2.5"
      onClick={handleAddPayloadPair}
    >
      +
    </button>
  </div>
)}

  {/* <div className="mb-4">
          <label htmlFor="threshold" className="block text-gray-700 font-bold mb-2">Thresholds:</label>
          <select
            id="threshold"
            name="threshold"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          >
            <option value="">Select a threshold option</option>
            <option value="http_req_duration: ['p(90)<500'],http_req_failed: ['rate<0.01']">
              90% of requests must complete within 500ms and less than 1% of requests can fail
            </option>
            <option value="http_req_duration: ['p(95)<500']">
              95% of requests must complete within 500ms
            </option>
            <option value="http_req_duration: ['p(99)<500']">
              99% of requests must complete within 500ms
            </option>
            <option value="http_req_duration: ['avg<500']">Average response time must be less than 500ms</option>
            <option value="http_req_duration: ['min<100', 'p(90)<200']">
              Minimum response time must be less than 100ms and 90% of requests must complete within 200ms
            </option>
            <option value="http_req_duration: ['max<500']">Maximum response time must be less than 500ms</option>
            <option value="http_req_failed: ['rate<0.05']">Less than 5% of requests can fail</option>
            <option value="http_req_failed: ['count<10']">No more than 10 requests</option>
          </select>
        </div> */}
        <div className="mb-4">
          <label htmlFor="expectedResponse" className="block text-gray-700 font-bold mb-2">Expected Response:</label>
          <input
            type="text"
            id="expectedResponse"
            placeholder='Expected Response[String]'
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            name="expectedResponse"
            value={expectedResponse}
            onChange={(e) => setExpectedResponse(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="sleepTime" className="block text-gray-700 font-bold mb-2">Sleep Time:</label>
          <input
            type="number"
            id="sleepTime"
            placeholder='In milliseconds'
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            name="sleepTime"
            value={sleepTime}
            min="0"
            onChange={(e) => setSleepTime(e.target.value)}
          />
        </div>


        <button type="submit" class="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900">Generate k6 Script</button>
      </form>

      { k6Script && (
  <div className="bg-white shadow-md rounded px-8 py-4">
    <div className="flex items-center mb-4">
      <button
        type="button"
        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
        onClick={handleCopyScript}
      >
        { copied ? 'Copied!' : 'Copy Script' }
      </button>
      <input
        type="text"
        id="exportFilename"
        className="appearance-none rounded-none relative block w-40 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
        placeholder="Filename"
        value={exportFilename}
        onChange={(e) => setExportFilename(e.target.value)}
      />
      <button
        type="button"
        className="text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 ml-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900"
        onClick={handleExportScript}
      >
        Export
      </button>
    </div>
    <h2 className="text-xl mb-4">Generated k6 Script:</h2>
    <textarea
      id="k6-script"
      
      name="k6-script"
      rows="10"
      readOnly
      value={k6Script}
      ref={k6ScriptRef}
      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
    ></textarea>
  </div>
)}
    </div>
  </div>
  );
}
export default Apik6;