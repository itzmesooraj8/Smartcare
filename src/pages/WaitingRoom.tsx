import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const WaitingRoom: React.FC = () => {
  // Mock data for queue and doctor profile
  const queuePosition = 2;
  const [estimatedWait, setEstimatedWait] = React.useState(5); // in minutes
  const doctor = {
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    avatar: '',
  };
  // Mock other patients in queue
  const otherPatients = [
    { id: 1, avatar: '/placeholder.svg' },
    { id: 2, avatar: '/placeholder.svg' },
    { id: 3, avatar: '/placeholder.svg' },
  ];
  // Simulate estimated wait time countdown
  React.useEffect(() => {
    if (estimatedWait > 1) {
      const timer = setTimeout(() => setEstimatedWait(estimatedWait - 1), 60000);
      return () => clearTimeout(timer);
    }
  }, [estimatedWait]);
  // Soft music toggle (mock)
  const [musicOn, setMusicOn] = React.useState(false);
  const handleTestDevices = () => {
    alert('Camera and microphone test successful!');
  };

  return (
    <div className={`min-h-screen flex flex-col ${musicOn ? 'bg-gradient-to-br from-blue-200 via-indigo-200 to-blue-100 animate-pulse' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="w-7 h-7 text-blue-600" /> Virtual Waiting Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-lg font-semibold">Your Position in Queue</div>
              <div className="text-3xl font-bold text-blue-700">{queuePosition}</div>
              <div className="flex justify-center gap-2 mt-2 mb-2">
                {otherPatients.map(p => (
                  <img key={p.id} src={p.avatar} alt="Patient" className="w-8 h-8 rounded-full border border-blue-300" />
                ))}
              </div>
              <div className="w-full bg-blue-100 rounded-full h-3 mt-2 mb-2">
                <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${(estimatedWait/5)*100}%` }}></div>
              </div>
              <div className="text-sm text-gray-600">Estimated Wait: {estimatedWait} min</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center">
                <User className="w-10 h-10 text-blue-700" />
              </div>
              <div className="font-bold text-blue-700">{doctor.name}</div>
              <div className="text-sm text-gray-600">{doctor.specialty}</div>
            </div>
            <div className="mt-6 text-blue-600 text-sm text-center">
              Please wait while your doctor prepares for your consultation. Relax and keep your device ready.
            </div>
            <div className="mt-6">
              <div className="font-semibold mb-2">Tips for a Successful Video Consult:</div>
              <ul className="list-disc pl-6 text-gray-700 text-left">
                <li>Check your internet connection</li>
                <li>Test your camera and microphone</li>
                <li>Prepare your questions and documents</li>
                <li>Find a quiet, well-lit space</li>
              </ul>
              <div className="flex gap-4 mt-4 justify-center">
                <button className="bg-blue-600 text-white px-4 py-2 rounded shadow" onClick={handleTestDevices}>Test Devices</button>
                <button className={`px-4 py-2 rounded shadow ${musicOn ? 'bg-indigo-400 text-white' : 'bg-gray-200 text-blue-700'}`} onClick={()=>setMusicOn(!musicOn)}>
                  {musicOn ? 'Turn Off Music' : 'Play Calming Music'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default WaitingRoom;
