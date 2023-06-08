import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';

function ApiGroup() {
  const [url, setUrl] = useState('');
  const [groups, setGroups] = useState([{ groupName: '', endpoint: '' }]);
  const [k6Script, setK6Script] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportFilename, setExportFilename] = useState('');

  const k6ScriptRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();

    let k6Script = `
import { check, group } from 'k6';
import http from 'k6/http';

export default function () {
`;

    groups.forEach((group) => {
      const { groupName, endpoint } = group;
      k6Script += `
  group('${groupName}', function () {
    const res = http.get("${url}" + '${endpoint}');
    check(res, { 'is status 200': (r) => r.status === 200 });
  });
  `;
    });

    k6Script += `}
`;

    setK6Script(k6Script);
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

  function handleAddGroup() {
    setGroups([...groups, { groupName: '', endpoint: '' }]);
  }

  function handleRemoveGroup(index) {
    const updatedGroups = [...groups];
    updatedGroups.splice(index, 1);
    setGroups(updatedGroups);
  }

  function handleGroupNameChange(index, value) {
    const updatedGroups = [...groups];
    updatedGroups[index].groupName = value;
    setGroups(updatedGroups);
  }

  function handleEndpointChange(index, value) {
    const updatedGroups = [...groups];
    updatedGroups[index].endpoint = value;
    setGroups(updatedGroups);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700">Load Test - API-Group</h2>

          <div className="mb-4">
            <label htmlFor="url" className="block text-gray-700 font-bold mb-2">
              Website API:*
            </label>
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
          
          {groups.map((group, index) => (
            <div key={index} className="mb-4">
              <label htmlFor={`groupName${index}`} className="block text-gray-700 font-bold mb-2">
                Group Name {index + 1}:*
              </label>
              <input
                type="text"
                id={`groupName${index}`}
                name={`groupName${index}`}
                placeholder="Enter the group name"
                required
                value={group.groupName}
                onChange={(e) => handleGroupNameChange(index, e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />

              <label htmlFor={`endpoint${index}`} className="block text-gray-700 font-bold mb-2">
                Endpoint {index + 1}:*
              </label>
              <input
                type="text"
                id={`endpoint${index}`}
                name={`endpoint${index}`}
                placeholder="Enter the endpoint"
                required
                value={group.endpoint}
                onChange={(e) => handleEndpointChange(index, e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />

              {index > 0 && (
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 focus:outline-none focus:text-red-700"
                  onClick={() => handleRemoveGroup(index)}
                >
                  Remove Group
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="text-blue-500 hover:text-blue-700 focus:outline-none"
            onClick={handleAddGroup}
          >
            + Add Group
          </button>
          <br />

          <button
            type="submit"
            className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
          >
            Generate k6 Script
          </button>
        </form>

        {k6Script && (
          <div className="bg-white shadow-md rounded px-8 py-4">
            <div className="flex items-center mb-4">
              <button
                type="button"
                className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                onClick={handleCopyScript}
              >
                {copied ? 'Copied!' : 'Copy Script'}
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

export default ApiGroup;
