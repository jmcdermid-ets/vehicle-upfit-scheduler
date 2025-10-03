import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, Save, Users, Bell, FileText, Database, Cloud } from 'lucide-react';

const VehicleUpfitSchedule = () => {
  const processes = ['Body Assembly', 'Body Mount', 'Options', 'Liftgates', 'Vending', 'Refrigeration', 'Final'];
  const processDurations = {
    'Body Assembly': 3,
    'Body Mount': 2,
    'Options': 2,
    'Liftgates': 2,
    'Vending': 1,
    'Refrigeration': 3,
    'Final': 2
  };

  const initializeVehicleProcesses = () => {
    const procs = {};
    processes.forEach(proc => {
      procs[proc] = {
        planned: processDurations[proc],
        actual: 0,
        complete: false
      };
    });
    return procs;
  };

  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      name: 'REF-001',
      startDate: 1,
      assignedTo: '',
      priority: 'normal',
      notes: '',
      processes: {
        'Body Assembly': { planned: 3, actual: 3, complete: true },
        'Body Mount': { planned: 2, actual: 2, complete: true },
        'Options': { planned: 2, actual: 2, complete: true },
        'Liftgates': { planned: 2, actual: 1, complete: false },
        'Vending': { planned: 1, actual: 0, complete: false },
        'Refrigeration': { planned: 3, actual: 0, complete: false },
        'Final': { planned: 2, actual: 0, complete: false }
      }
    },
    {
      id: 2,
      name: 'REF-002',
      startDate: 5,
      assignedTo: '',
      priority: 'high',
      notes: '',
      processes: {
        'Body Assembly': { planned: 3, actual: 3, complete: true },
        'Body Mount': { planned: 2, actual: 1, complete: false },
        'Options': { planned: 2, actual: 0, complete: false },
        'Liftgates': { planned: 2, actual: 0, complete: false },
        'Vending': { planned: 1, actual: 0, complete: false },
        'Refrigeration': { planned: 3, actual: 0, complete: false },
        'Final': { planned: 2, actual: 0, complete: false }
      }
    }
  ]);

  const [currentDay, setCurrentDay] = useState(10);
  const [currentUser, setCurrentUser] = useState('Production Manager');
  const [showSettings, setShowSettings] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [teamMembers, setTeamMembers] = useState(['John Smith', 'Jane Doe', 'Mike Johnson']);
  const daysInMonth = 30;

  useEffect(() => {
    if (autoSave) {
      const timer = setTimeout(() => {
        saveToLocalStorage();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [vehicles, autoSave]);

  useEffect(() => {
    loadFromLocalStorage();
    checkForAlerts();
  }, []);

  const saveToLocalStorage = () => {
    localStorage.setItem('vehicleSchedule', JSON.stringify({
      vehicles,
      currentDay,
      teamMembers,
      lastSaved: new Date().toISOString()
    }));
    addNotification('Schedule auto-saved', 'success');
  };

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('vehicleSchedule');
    if (saved) {
      const data = JSON.parse(saved);
      setVehicles(data.vehicles || vehicles);
      setCurrentDay(data.currentDay || currentDay);
      setTeamMembers(data.teamMembers || teamMembers);
    }
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const checkForAlerts = () => {
    vehicles.forEach(vehicle => {
      processes.forEach(proc => {
        const schedule = getProcessSchedule(vehicle, proc);
        const process = vehicle.processes[proc];
        if (currentDay > schedule.endDay && !process.complete) {
          addNotification(`${vehicle.name} - ${proc} is overdue!`, 'warning');
        }
      });
    });
  };

  const addVehicle = () => {
    const newId = Math.max(...vehicles.map(v => v.id), 0) + 1;
    const newVehicle = {
      id: newId,
      name: `REF-${String(newId).padStart(3, '0')}`,
      startDate: 1,
      assignedTo: '',
      priority: 'normal',
      notes: '',
      processes: initializeVehicleProcesses()
    };
    setVehicles([...vehicles, newVehicle]);
    addNotification(`Vehicle ${newVehicle.name} added`, 'success');
  };

  const removeVehicle = (id) => {
    const vehicle = vehicles.find(v => v.id === id);
    setVehicles(vehicles.filter(v => v.id !== id));
    addNotification(`Vehicle ${vehicle.name} removed`, 'info');
  };

  const updateVehicle = (id, field, value) => {
    setVehicles(vehicles.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const updateProcess = (vehicleId, processName, field, value) => {
    setVehicles(vehicles.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          processes: {
            ...v.processes,
            [processName]: {
              ...v.processes[processName],
              [field]: field === 'complete' ? value : parseInt(value) || 0
            }
          }
        };
      }
      return v;
    }));
  };

  const getProcessSchedule = (vehicle, processName) => {
    let startDay = vehicle.startDate;
    const processIndex = processes.indexOf(processName);
    
    for (let i = 0; i < processIndex; i++) {
      const process = vehicle.processes[processes[i]];
      if (process && process.planned) {
        startDay += process.planned;
      }
    }
    
    const process = vehicle.processes[processName];
    const planned = process?.planned || 0;
    const actual = process?.actual || 0;
    const endDay = startDay + planned - 1;
    const actualEndDay = startDay + actual - 1;
    
    return { startDay, endDay, actualEndDay };
  };

  const exportToCSV = () => {
    let csv = 'Vehicle,Priority,Assigned To,Process,Planned Start,Planned End,Planned Duration,Actual Duration,Complete,Variance,Status\n';
    
    vehicles.forEach(vehicle => {
      processes.forEach(proc => {
        const schedule = getProcessSchedule(vehicle, proc);
        const planned = vehicle.processes[proc].planned;
        const actual = vehicle.processes[proc].actual;
        const variance = actual - planned;
        const status = vehicle.processes[proc].complete ? 'Complete' : 
                      (currentDay > schedule.endDay ? 'Overdue' : 'On Track');
        csv += `${vehicle.name},${vehicle.priority},${vehicle.assignedTo},${proc},Day ${schedule.startDay},Day ${schedule.endDay},${planned},${actual},${vehicle.processes[proc].complete},${variance},${status}\n`;
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle_upfit_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addNotification('Schedule exported to CSV', 'success');
  };

  const exportToJSON = () => {
    const data = {
      vehicles,
      currentDay,
      teamMembers,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle_upfit_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    addNotification('Backup created', 'success');
  };

  const getCellStatus = (day, schedule, process) => {
    if (day >= schedule.startDay && day <= schedule.endDay) {
      if (day <= currentDay) {
        if (process.complete) {
          return 'bg-green-500 border-green-600';
        } else if (day <= schedule.actualEndDay) {
          return 'bg-yellow-500 border-yellow-600';
        } else {
          return 'bg-red-300 border-red-400';
        }
      }
      return 'bg-blue-300 border-blue-400';
    }
    return 'bg-gray-100 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600 font-bold';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6 overflow-auto">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`px-4 py-3 rounded shadow-lg ${
              notif.type === 'success' ? 'bg-green-500' :
              notif.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            } text-white animate-slide-in`}
          >
            {notif.message}
          </div>
        ))}
      </div>

      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">Refrigerated Vehicle Upfit Production</h1>
              <p className="text-blue-100 mt-1">Enterprise Production Management System</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded hover:bg-blue-50"
              >
                <Database size={20} /> Settings
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="bg-white text-gray-800 p-4 rounded mt-4">
              <h3 className="font-bold mb-3">System Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Current User</label>
                  <input
                    type="text"
                    value={currentUser}
                    onChange={(e) => setCurrentUser(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-semibold">Enable Auto-Save</span>
                  </label>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-semibold mb-1">Team Members (comma separated)</label>
                <input
                  type="text"
                  value={teamMembers.join(', ')}
                  onChange={(e) => setTeamMembers(e.target.value.split(',').map(m => m.trim()))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={addVehicle}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus size={20} /> Add Vehicle
            </button>
            <button
              onClick={saveToLocalStorage}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Save size={20} /> Save Now
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              <Download size={20} /> Export CSV
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <Cloud size={20} /> Backup Data
            </button>
            <button
              onClick={checkForAlerts}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              <Bell size={20} /> Check Alerts
            </button>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700">Current Production Day:</label>
            <input
              type="number"
              min="1"
              max={daysInMonth}
              value={currentDay}
              onChange={(e) => setCurrentDay(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border-2 border-yellow-400 rounded font-bold"
            />
            <div className="flex gap-4 text-sm ml-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 border-2 border-blue-400"></div>
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 border-2 border-green-600"></div>
                <span>Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 border-2 border-yellow-600"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-300 border-2 border-red-400"></div>
                <span>Behind</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left border">Vehicle</th>
                <th className="px-3 py-2 text-left border">Priority</th>
                <th className="px-3 py-2 text-left border">Assigned</th>
                <th className="px-3 py-2 text-left border">Process</th>
                <th className="px-2 py-2 text-center border">Start</th>
                <th className="px-2 py-2 text-center border">Plan</th>
                <th className="px-2 py-2 text-center border">Actual</th>
                <th className="px-2 py-2 text-center border">Done</th>
                {[...Array(daysInMonth)].map((_, i) => (
                  <th key={i} className={`px-1 py-2 text-center border text-xs ${i + 1 === currentDay ? 'bg-yellow-200' : ''}`}>
                    {i + 1}
                  </th>
                ))}
                <th className="px-3 py-2 text-center border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle, vIdx) => (
                <React.Fragment key={vehicle.id}>
                  {processes.map((proc, pIdx) => {
                    const schedule = getProcessSchedule(vehicle, proc);
                    const process = vehicle.processes[proc];
                    
                    return (
                      <tr key={`${vehicle.id}-${proc}`} className="hover:bg-gray-50">
                        {pIdx === 0 && (
                          <>
                            <td rowSpan={processes.length} className="px-3 py-2 border">
                              <input
                                type="text"
                                value={vehicle.name}
                                onChange={(e) => updateVehicle(vehicle.id, 'name', e.target.value)}
                                className="w-24 px-2 py-1 border rounded font-semibold"
                              />
                            </td>
                            <td rowSpan={processes.length} className="px-3 py-2 border">
                              <select
                                value={vehicle.priority}
                                onChange={(e) => updateVehicle(vehicle.id, 'priority', e.target.value)}
                                className={`w-20 px-2 py-1 border rounded ${getPriorityColor(vehicle.priority)}`}
                              >
                                <option value="high">High</option>
                                <option value="normal">Normal</option>
                                <option value="low">Low</option>
                              </select>
                            </td>
                            <td rowSpan={processes.length} className="px-3 py-2 border">
                              <select
                                value={vehicle.assignedTo}
                                onChange={(e) => updateVehicle(vehicle.id, 'assignedTo', e.target.value)}
                                className="w-32 px-2 py-1 border rounded text-xs"
                              >
                                <option value="">Unassigned</option>
                                {teamMembers.map(member => (
                                  <option key={member} value={member}>{member}</option>
                                ))}
                              </select>
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2 border font-medium">{proc}</td>
                        {pIdx === 0 && (
                          <td rowSpan={processes.length} className="px-2 py-2 border text-center">
                            <input
                              type="number"
                              min="1"
                              max={daysInMonth}
                              value={vehicle.startDate}
                              onChange={(e) => updateVehicle(vehicle.id, 'startDate', parseInt(e.target.value) || 1)}
                              className="w-14 px-2 py-1 border rounded text-center"
                            />
                          </td>
                        )}
                        <td className="px-2 py-2 border text-center">
                          <input
                            type="number"
                            min="1"
                            value={process.planned}
                            onChange={(e) => updateProcess(vehicle.id, proc, 'planned', e.target.value)}
                            className="w-12 px-1 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-2 py-2 border text-center">
                          <input
                            type="number"
                            min="0"
                            value={process.actual}
                            onChange={(e) => updateProcess(vehicle.id, proc, 'actual', e.target.value)}
                            className="w-12 px-1 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-2 py-2 border text-center">
                          <input
                            type="checkbox"
                            checked={process.complete}
                            onChange={(e) => updateProcess(vehicle.id, proc, 'complete', e.target.checked)}
                            className="w-4 h-4"
                          />
                        </td>
                        {[...Array(daysInMonth)].map((_, day) => (
                          <td
                            key={day}
                            className={`border-2 ${getCellStatus(day + 1, schedule, process)}`}
                          >
                            &nbsp;
                          </td>
                        ))}
                        {pIdx === 0 && (
                          <td rowSpan={processes.length} className="px-3 py-2 border text-center">
                            <button
                              onClick={() => removeVehicle(vehicle.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Remove Vehicle"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {vIdx < vehicles.length - 1 && (
                    <tr className="bg-gray-200">
                      <td colSpan={8 + daysInMonth + 1} className="h-1"></td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText size={24} /> Production Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map(vehicle => {
              const totalPlanned = processes.reduce((sum, proc) => sum + vehicle.processes[proc].planned, 0);
              const totalActual = processes.reduce((sum, proc) => sum + vehicle.processes[proc].actual, 0);
              const completedProcesses = processes.filter(proc => vehicle.processes[proc].complete).length;
              const progressPercent = (completedProcesses / processes.length) * 100;
              const variance = totalActual - totalPlanned;
              const isOnTrack = variance <= 0 && progressPercent > 0;
              
              return (
                <div key={vehicle.id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">{vehicle.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      vehicle.priority === 'high' ? 'bg-red-100 text-red-700' :
                      vehicle.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {vehicle.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned:</span>
                      <span className="font-semibold">{vehicle.assignedTo || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Planned Duration:</span>
                      <span className="font-semibold">{totalPlanned} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Duration:</span>
                      <span className="font-semibold">{totalActual} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variance:</span>
                      <span className={`font-bold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance > 0 ? '+' : ''}{variance} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-semibold">{completedProcesses}/{processes.length} processes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        progressPercent === 100 ? 'bg-green-100 text-green-700' :
                        isOnTrack ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {progressPercent === 100 ? 'COMPLETE' : isOnTrack ? 'ON TRACK' : 'NEEDS ATTENTION'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          progressPercent === 100 ? 'bg-green-500' :
                          progressPercent >= 50 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-gray-100 border-t text-center text-sm text-gray-600">
          <p>Enterprise Production Management System v2.0 | Last saved: {autoSave ? 'Auto-save enabled' : 'Manual save'} | User: {currentUser}</p>
        </div>
      </div>
    </div>
  );
};

export default VehicleUpfitSchedule;
