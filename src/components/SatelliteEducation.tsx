import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Shield, 
  Rocket, 
  Settings,
  Satellite,
  Globe,
  Wifi,
  Navigation,
  Eye,
  Wrench,
  Factory,
  Users
} from 'lucide-react';

const SatelliteEducation = () => {
  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-black text-terminal-green mb-3">
          SATELLITE TECHNOLOGY CENTER
        </h1>
        <p className="text-base text-neon-cyan font-terminal">
          [ COMPREHENSIVE GUIDE TO ORBITAL SYSTEMS ]
        </p>
      </div>

      <Tabs defaultValue="commercial" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-panel mb-6">
          <TabsTrigger value="commercial" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Commercial</span>
          </TabsTrigger>
          <TabsTrigger value="government" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Government</span>
          </TabsTrigger>
          <TabsTrigger value="manufacturing" className="flex items-center space-x-2">
            <Rocket className="h-4 w-4" />
            <span>Build & Launch</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Operations</span>
          </TabsTrigger>
        </TabsList>

        {/* Commercial Satellites Tab */}
        <TabsContent value="commercial" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <Building className="h-6 w-6 text-primary" />
                <span>Commercial Satellite Industry</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Communications */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Wifi className="h-5 w-5 text-stellar-cyan" />
                  <span>Communication Satellites</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Commercial communication satellites form the backbone of global telecommunications, 
                  enabling everything from satellite TV and radio to internet connectivity in remote areas.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Applications:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Direct-to-Home (DTH) television</li>
                      <li>• Mobile satellite communications</li>
                      <li>• Maritime and aviation connectivity</li>
                      <li>• Emergency communications</li>
                      <li>• Internet backhaul services</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Major Providers:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Intelsat, SES, Eutelsat</li>
                      <li>• Hughes Network Systems</li>
                      <li>• Viasat, Iridium</li>
                      <li>• Starlink (SpaceX)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Earth Observation */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Eye className="h-5 w-5 text-jupiter-amber" />
                  <span>Earth Observation & Imaging</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Commercial Earth observation satellites provide high-resolution imagery and data 
                  for agriculture, urban planning, environmental monitoring, and business intelligence.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Applications:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Precision agriculture monitoring</li>
                      <li>• Disaster response and assessment</li>
                      <li>• Urban development planning</li>
                      <li>• Environmental compliance</li>
                      <li>• Supply chain monitoring</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Leading Companies:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Planet Labs, Maxar</li>
                      <li>• BlackSky, Capella Space</li>
                      <li>• Airbus Defence & Space</li>
                      <li>• Skybox Imaging (Google)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Navigation className="h-5 w-5 text-nebula-purple" />
                  <span>Navigation & Positioning</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Commercial applications of GNSS technology extend far beyond consumer GPS, 
                  enabling precision agriculture, autonomous vehicles, and location-based services.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Government Satellites Tab */}
        <TabsContent value="government" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <span>Government & Military Systems</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Military Satellites */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Shield className="h-5 w-5 text-danger-red" />
                  <span>Military & Defense Satellites</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Military satellites provide secure communications, intelligence gathering, 
                  missile warning systems, and navigation for defense operations worldwide.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Functions:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Secure military communications</li>
                      <li>• Intelligence, surveillance & reconnaissance</li>
                      <li>• Early warning systems</li>
                      <li>• Electronic warfare capabilities</li>
                      <li>• Weather monitoring for operations</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Major Programs:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• MILSTAR, AEHF (US)</li>
                      <li>• Skynet (UK)</li>
                      <li>• Syracuse (France)</li>
                      <li>• Kondor, Persona (Russia)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Space Stations */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Satellite className="h-5 w-5 text-stellar-cyan" />
                  <span>Space Stations & Research</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Government-operated space stations serve as platforms for scientific research, 
                  technology demonstration, and international cooperation in space exploration.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Current Stations:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• International Space Station (ISS)</li>
                      <li>• Tiangong Space Station (China)</li>
                      <li>• Future Lunar Gateway</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Research Areas:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Microgravity experiments</li>
                      <li>• Materials science</li>
                      <li>• Life sciences & medicine</li>
                      <li>• Earth observation</li>
                      <li>• Technology demonstration</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Weather Satellites */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Globe className="h-5 w-5 text-jupiter-amber" />
                  <span>Weather & Climate Monitoring</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Government weather satellites provide critical data for weather forecasting, 
                  climate research, and disaster preparedness on a global scale.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manufacturing & Launch Tab */}
        <TabsContent value="manufacturing" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <Rocket className="h-6 w-6 text-primary" />
                <span>Satellite Manufacturing & Launch</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Design & Manufacturing */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Factory className="h-5 w-5 text-stellar-cyan" />
                  <span>Design & Manufacturing Process</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Satellite manufacturing involves complex engineering, precision assembly, 
                  and extensive testing to ensure systems can survive the harsh environment of space.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Components:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Bus structure & thermal systems</li>
                      <li>• Power systems (solar panels, batteries)</li>
                      <li>• Attitude control & propulsion</li>
                      <li>• Communication antennas & transponders</li>
                      <li>• Payload instruments</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Testing Phases:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Thermal vacuum testing</li>
                      <li>• Vibration & shock testing</li>
                      <li>• Electromagnetic compatibility</li>
                      <li>• System integration testing</li>
                      <li>• Launch simulation</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Launch Systems */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Rocket className="h-5 w-5 text-jupiter-amber" />
                  <span>Launch Vehicles & Systems</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Getting satellites to orbit requires powerful rockets and precise mission planning. 
                  Modern launch systems range from small dedicated launchers to heavy-lift vehicles.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Launch Providers:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• SpaceX (Falcon 9, Falcon Heavy)</li>
                      <li>• ULA (Atlas V, Delta IV)</li>
                      <li>• Arianespace (Ariane 5/6)</li>
                      <li>• Roscosmos (Soyuz, Proton)</li>
                      <li>• Small sat launchers (RocketLab, etc.)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Orbit Types:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Low Earth Orbit (LEO): 160-2000 km</li>
                      <li>• Medium Earth Orbit (MEO): 2000-35,786 km</li>
                      <li>• Geostationary Orbit (GEO): 35,786 km</li>
                      <li>• Sun-synchronous orbits</li>
                      <li>• Highly elliptical orbits</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mission Planning */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Navigation className="h-5 w-5 text-nebula-purple" />
                  <span>Mission Planning & Deployment</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Successful satellite missions require careful planning of orbits, launch windows, 
                  and deployment sequences to achieve mission objectives.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <Settings className="h-6 w-6 text-primary" />
                <span>Satellite Operations & Maintenance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ground Operations */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Users className="h-5 w-5 text-stellar-cyan" />
                  <span>Ground Control Operations</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Satellite operations centers monitor and control spacecraft 24/7, 
                  ensuring optimal performance and mission success throughout the satellite's lifetime.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Daily Operations:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Health & status monitoring</li>
                      <li>• Command & control sequences</li>
                      <li>• Data downlink management</li>
                      <li>• Orbit tracking & prediction</li>
                      <li>• Anomaly detection & response</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Ground Infrastructure:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Mission control centers</li>
                      <li>• Tracking, telemetry & command stations</li>
                      <li>• Data processing facilities</li>
                      <li>• Backup & contingency systems</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Maintenance & Servicing */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Wrench className="h-5 w-5 text-jupiter-amber" />
                  <span>In-Orbit Maintenance & Servicing</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Modern satellite servicing missions can extend spacecraft life, 
                  upgrade capabilities, and even repair failed systems through robotic operations.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Servicing Capabilities:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Fuel refueling operations</li>
                      <li>• Component replacement</li>
                      <li>• Orbit adjustments & relocation</li>
                      <li>• Antenna & solar panel repair</li>
                      <li>• Software & firmware updates</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Service Providers:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Northrop Grumman (MEV)</li>
                      <li>• Space Logistics LLC</li>
                      <li>• Orbital ATK (now Northrop)</li>
                      <li>• Future commercial servicers</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* End of Life */}
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2 mb-3">
                  <Globe className="h-5 w-5 text-nebula-purple" />
                  <span>End-of-Life & Deorbit Operations</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Responsible satellite operations include planning for end-of-life disposal 
                  to prevent space debris and maintain the orbital environment for future missions.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Disposal Methods:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Controlled atmospheric reentry</li>
                      <li>• Graveyard orbit placement</li>
                      <li>• Active debris removal</li>
                      <li>• Propulsive deorbit burns</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Regulatory Requirements:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• 25-year deorbit rule</li>
                      <li>• Collision avoidance measures</li>
                      <li>• Space debris mitigation</li>
                      <li>• International guidelines</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SatelliteEducation;