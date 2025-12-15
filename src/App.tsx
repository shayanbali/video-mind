import React, { useRef, useState } from 'react';
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer';
import MindMap from './components/MindMap';
import TranscriptionPanel from './components/TranscriptionPanel';
import JsonUpload from './components/JsonUpload';
import VideoMindMapGenerator from './components/VideoMindMapGenerator';
import TextToSpeechButton from './components/TextToSpeechButton';
import QuickTour from './components/QuickTour';
import EthicsDisclaimer from './components/EthicsDisclaimer';
import BiasReportModal from './components/BiasReportModal';
import AIContentWarning from './components/AIContentWarning';
import { mockMindMapData, smallMindMapData, largeMindMapData } from './data/mockData';
import { Brain, Video, Map, Database, Upload, Sparkles, ChevronDown, RotateCcw, Download, ChevronUp } from 'lucide-react';
import { MindMapData } from './types';

function App() {
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeView, setActiveView] = useState<'split' | 'video' | 'mindmap'>('split');
  const [currentDataset, setCurrentDataset] = useState<'small' | 'medium' | 'large'>('medium');
  const [showJsonUpload, setShowJsonUpload] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [uploadedData, setUploadedData] = useState<MindMapData | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [showGenerateDropdown, setShowGenerateDropdown] = useState(false);
  const [currentMindMapSource, setCurrentMindMapSource] = useState<'default' | 'uploaded' | 'history'>('default');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);
  const [subtitleSize, setSubtitleSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showTour, setShowTour] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [showEthicsDisclaimer, setShowEthicsDisclaimer] = useState(false);
  const [showBiasReport, setShowBiasReport] = useState(false);
  const [biasReportContext, setBiasReportContext] = useState<any>(null);
  const [hasAcceptedEthics, setHasAcceptedEthics] = useState<boolean | null>(null);
  const [ethicsChecked, setEthicsChecked] = useState(false);
  const [showSummarySection, setShowSummarySection] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsVideoFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleDownloadMindMap = () => {
    const currentData = getDataset();
    const filename = `${currentData.root_topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.json`;
    
    // Create downloadable JSON
    const jsonString = JSON.stringify(currentData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    URL.revokeObjectURL(url);
  };

  // Check ethics acceptance on mount
  React.useEffect(() => {
    console.log('Checking ethics acceptance...');
    const ethicsAccepted = localStorage.getItem('videomind-ethics-accepted');
    console.log('Ethics localStorage value:', ethicsAccepted);
    
    // Force show ethics popup for testing - remove this line after testing
    if (false && ethicsAccepted === 'true') {
      console.log('Ethics already accepted');
      setHasAcceptedEthics(true);
      
      // Show tour if first time
      const hasSeenTour = localStorage.getItem('videomind-tour-seen');
      if (!hasSeenTour) {
        setTimeout(() => {
          setShowTour(true);
        }, 1000);
      }
    } else {
      console.log('Ethics not accepted, showing disclaimer');
      setHasAcceptedEthics(false);
    }
    setEthicsChecked(true);
  }, []);

  // Show tour after ethics acceptance
  React.useEffect(() => {
    if (hasAcceptedEthics === true) {
      const hasSeenTour = localStorage.getItem('videomind-tour-seen');
      if (!hasSeenTour) {
        setTimeout(() => {
          setShowTour(true);
        }, 500);
      }
    }
  }, [hasAcceptedEthics]);

  const handleAcceptEthics = () => {
    console.log('Ethics accepted');
    localStorage.setItem('videomind-ethics-accepted', 'true');
    setHasAcceptedEthics(true);
    setShowEthicsDisclaimer(false);
  };

  // Show loading while checking ethics
  if (hasAcceptedEthics === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing VideoMind...</p>
        </div>
      </div>
    );
  }

  const handleReportBias = (context?: any) => {
    setBiasReportContext(context);
    setShowBiasReport(true);
  };

  const handleCloseTour = () => {
    setShowTour(false);
    localStorage.setItem('videomind-tour-seen', 'true');
  };

  const handleShowTour = () => {
    setShowTour(true);
  };

  const getDataset = (): MindMapData => {
    if (uploadedData) return uploadedData;
    switch (currentDataset) {
      case 'small': return smallMindMapData;
      case 'large': return largeMindMapData;
      default: return mockMindMapData;
    }
  };

  const currentData = getDataset();

  const handleNodeClick = (timestamp: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(timestamp);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDataLoaded = (data: MindMapData, videoUrl?: string) => {
    setUploadedData(data);
    if (uploadedVideoUrl && uploadedVideoUrl !== videoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    setUploadedVideoUrl(videoUrl || null);
    setCurrentVideoUrl(videoUrl || null);
    setShowJsonUpload(false);
    setShowVideoGenerator(false);
    setCurrentMindMapSource('uploaded');
    setCurrentDataset('medium'); // Reset dataset selector
  };

  const handleVideoGeneratorDataLoaded = (data: MindMapData, videoUrl?: string) => {
    try {
      console.log('Received data from video generator:', data);
      
      // Validate data before processing
      if (!data || !data.nodes || !Array.isArray(data.nodes)) {
        console.error('Invalid data received from video generator:', data);
        return;
      }
      
    setUploadedData(data);
    if (uploadedVideoUrl && uploadedVideoUrl !== videoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    setUploadedVideoUrl(videoUrl || null);
    setCurrentVideoUrl(videoUrl || null);
    setShowVideoGenerator(false);
    setCurrentMindMapSource('uploaded');
    } catch (error) {
      console.error('Error processing video generator data:', error);
      // Don't close the modal if there's an error
    }
  };


  const handleResetToDefault = () => {
    setUploadedData(null);

    // Clean up video URLs
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
      setUploadedVideoUrl(null);
    }
    if (currentVideoUrl) {
      URL.revokeObjectURL(currentVideoUrl);
      setCurrentVideoUrl(null);
    }

    setCurrentMindMapSource('default');
  };

  const handleDownloadJson = () => {
    // Create filename based on current data source
    const filename = currentMindMapSource === 'default'
      ? `videomind_${currentDataset}_mindmap.json`
      : 'videomind_mindmap.json';

    // Create downloadable JSON
    const jsonString = JSON.stringify(currentData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    URL.revokeObjectURL(url);
  };

  // Get the video URL - prioritize uploaded video, then data video_url, then default
  const getVideoUrl = () => {
    if (currentVideoUrl) return currentVideoUrl;
    if (uploadedVideoUrl) return uploadedVideoUrl;
    if (currentData.video_url) return currentData.video_url;
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  };

  return (
    <>
      {/* Ethics Disclaimer - Show first before anything else */}
      {hasAcceptedEthics === false && (
        <EthicsDisclaimer
          isOpen={true}
          onClose={() => setShowEthicsDisclaimer(false)}
          onAccept={handleAcceptEthics}
        />
      )}
      
      {/* Main App - Only show after ethics accepted */}
      {hasAcceptedEthics && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50" role="main">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-300 sticky top-0 z-50 mb-4" role="banner">
        <div className="relative pb-6">
          <div className={`px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out ${isNavCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[200px] opacity-100'}`}>
            <div className="flex items-center justify-between py-6 min-h-[96px]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-near-black">VideoMind</h1>
                <p className="text-sm text-near-black">AI-Powered Video Summarization</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Action Buttons Row - Generate, Nodes, Tour */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Reset button (only show when uploaded data is active) */}
                <div className="min-w-[80px]">
                  {currentMindMapSource !== 'default' && (
                    <button
                      onClick={handleResetToDefault}
                      tabIndex={0}
                      role="button"
                      aria-label="Reset to default data"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-600 text-white hover:bg-gray-700 shadow-md hover:scale-105 whitespace-nowrap"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
                
                {/* Quick Tour Button */}
                <button
                  onClick={handleShowTour}
                  tabIndex={0}
                  role="button"
                  aria-label={`Take a quick tour of the ${activeView === 'split' ? 'split view' : activeView === 'video' ? 'video view' : 'mind map view'}`}
                  className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-400 text-sm font-medium transition-all duration-200 text-purple-900 hover:bg-purple-100 shadow-md hover:scale-105 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tour</span>
                </button>
                
                {/* Generate Mind-Map Dropdown */}
                <div className="relative">
                  <button
                    data-tour="generate-button"
                    onClick={() => setShowGenerateDropdown(!showGenerateDropdown)}
                    tabIndex={0}
                    role="button"
                    aria-label="Generate mind map options"
                    aria-expanded={showGenerateDropdown}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 shadow-md hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Generate Mind-Map</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showGenerateDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showGenerateDropdown && (
                    <div 
                      className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-300 z-50 overflow-hidden"
                      role="menu"
                      aria-label="Mind map generation options"
                    >
                      <button
                        onClick={() => {
                          setShowVideoGenerator(true);
                          setShowGenerateDropdown(false);
                        }}
                        role="menuitem"
                        tabIndex={0}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-near-black hover:bg-purple-50 hover:text-purple-800 transition-colors border-b border-gray-100"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                        </div>
                        <span>AI Generate</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowJsonUpload(true);
                          setShowGenerateDropdown(false);
                        }}
                        role="menuitem"
                        tabIndex={0}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-near-black hover:bg-green-50 hover:text-green-800 transition-colors border-b border-gray-100"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                          <Upload className="w-4 h-4 text-green-600" />
                        </div>
                        <span>Upload JSON</span>
                      </button>

                      <button
                        onClick={() => {
                          handleDownloadJson();
                          setShowGenerateDropdown(false);
                        }}
                        role="menuitem"
                        tabIndex={0}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-near-black hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                          <Download className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>Download JSON</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Dataset/Status Indicator - Moved next to Tour button */}
                <div className="min-w-[140px]">
                  {currentMindMapSource === 'default' ? (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-400">
                      <Database className="w-4 h-4 text-blue-700" />
                      <select
                        value={currentDataset}
                        onChange={(e) => setCurrentDataset(e.target.value as 'small' | 'medium' | 'large')}
                        aria-label="Select dataset size"
                        className="text-sm font-medium bg-transparent text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="small">3 Nodes</option>
                        <option value="medium">8 Nodes</option>
                        <option value="large">15 Nodes</option>
                      </select>
                    </div>
                  ) : currentMindMapSource === 'uploaded' ? (
                    <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 border border-green-400">
                      <Upload className="w-4 h-4 text-green-700" />
                      <span className="text-sm font-medium text-green-900 whitespace-nowrap">
                        Custom Data 
                        ({currentData.nodes.length} nodes)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-400">
                      <Brain className="w-4 h-4 text-indigo-700" />
                      <span className="text-sm font-medium text-indigo-900 whitespace-nowrap">
                        Generated 
                        ({currentData.nodes.length} nodes)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Toggle Buttons */}
              <div 
                data-tour="view-controls" 
                className="flex items-center bg-blue-50 rounded-lg p-1 border border-blue-400 ml-2"
                role="tablist"
                aria-label="View mode selection"
              >
                <button
                  onClick={() => setActiveView('split')}
                  role="tab"
                  tabIndex={0}
                  aria-selected={activeView === 'split'}
                  aria-controls="main-content"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeView === 'split' 
                      ? 'bg-blue-700 text-white shadow-sm' 
                      : 'text-near-black hover:bg-blue-100'
                  }`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setActiveView('video')}
                  role="tab"
                  tabIndex={0}
                  aria-selected={activeView === 'video'}
                  aria-controls="main-content"
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeView === 'video' 
                      ? 'bg-blue-700 text-white shadow-sm' 
                      : 'text-near-black hover:bg-blue-100'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </button>
                <button
                  onClick={() => setActiveView('mindmap')}
                  role="tab"
                  tabIndex={0}
                  aria-selected={activeView === 'mindmap'}
                  aria-controls="main-content"
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeView === 'mindmap' 
                      ? 'bg-blue-700 text-white shadow-sm' 
                      : 'text-near-black hover:bg-blue-100'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>Mind Map</span>
                </button>
              </div>
            </div>
          </div>
          </div>

          {/* Toggle Button - At the bottom of header with proper spacing */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setIsNavCollapsed(!isNavCollapsed)}
              className="px-4 py-1.5 bg-white border-2 border-blue-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              aria-label={isNavCollapsed ? 'Show navigation' : 'Hide navigation'}
              title={isNavCollapsed ? 'Show navigation' : 'Hide navigation'}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-near-black">
                {isNavCollapsed ? (
                  <>
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600">Show Nav</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                    <span>Hide Nav</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="w-full px-4 sm:px-6 lg:px-8 py-2 sm:py-4"
        role="main"
        aria-label={`${activeView} view of video mind map application`}
      >
        <>
        {activeView === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
            <div className="space-y-4">
              <section data-tour="video-player" className="bg-blue-200 rounded-xl shadow-lg p-2 sm:p-4">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center text-near-black">
                  <Video className="w-5 h-5 mr-2 text-blue-700" />
                  Video Player
                </h2>
                <VideoPlayer
                  ref={videoPlayerRef}
                  videoUrl={getVideoUrl()}
                  onTimeUpdate={handleTimeUpdate}
                  transcription={currentData.transcription || []}
                  showSubtitles={showTranscription}
                  onToggleSubtitles={() => setShowTranscription(!showTranscription)}
                  subtitleSize={subtitleSize}
                  onSubtitleSizeChange={setSubtitleSize}
                  mindMapData={currentData}
                  currentTime={currentTime}
                />
              </section>
              
              <section data-tour="summary-panel" className="bg-yellow-100 rounded-xl shadow-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-near-black">Video Summary</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSummarySection(!showSummarySection)}
                      className="p-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-lg transition-all duration-200 hover:scale-105"
                      title={showSummarySection ? "Hide summary" : "Show summary"}
                    >
                      {showSummarySection ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                    <TextToSpeechButton
                      text={(() => {
                        const activeNodeIndex = currentData.nodes.findIndex(node =>
                          currentTime >= node.timestamp[0] &&
                          currentTime < node.timestamp[1]
                        );
                        return activeNodeIndex >= 0 ? currentData.nodes[activeNodeIndex].summary.join('. ') : currentData.root_topic;
                      })()}
                      title={(() => {
                        const activeNodeIndex = currentData.nodes.findIndex(node =>
                          currentTime >= node.timestamp[0] &&
                          currentTime < node.timestamp[1]
                        );
                        return activeNodeIndex >= 0 ? "Listen to current segment summary" : "Listen to video summary";
                      })()}
                      variant="primary"
                      size="md"
                    />
                  </div>
                </div>

                {showSummarySection && (
                  <div className="text-near-black leading-relaxed text-lg font-medium space-y-4">
                  {/* Show currently playing node summary if available */}
                  {(() => {
                    const activeNodeIndex = currentData.nodes.findIndex(node => 
                      currentTime >= node.timestamp[0] && 
                      currentTime < node.timestamp[1]
                    );
                    if (activeNodeIndex >= 0) {
                      const activeNode = currentData.nodes[activeNodeIndex];
                      return (
                        <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                            <h4 className="font-bold text-yellow-900">Currently Playing:</h4>
                            <span className="text-sm bg-yellow-100 text-yellow-900 px-2 py-1 rounded-full font-medium">
                              {Math.floor(activeNode.timestamp[0] / 60)}:{(Math.floor(activeNode.timestamp[0] % 60)).toString().padStart(2, '0')} - {Math.floor(activeNode.timestamp[1] / 60)}:{(Math.floor(activeNode.timestamp[1] % 60)).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <h5 className="font-bold text-near-black mb-2">{activeNode.topic}</h5>
                          <div className="text-near-black leading-relaxed">
                            <ul className="list-disc list-inside space-y-1">
                              {activeNode.summary.map((point, index) => (
                                <li key={index} className="text-near-black">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {activeNode.keywords.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {activeNode.keywords.slice(0, 4).map((keyword, index) => (
                                <span key={index} className="bg-yellow-100 text-yellow-900 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-yellow-300 shadow-sm hover:bg-yellow-200 transition-colors">
                                  {keyword}
                                </span>
                              ))}
                              {activeNode.keywords.length > 4 && (
                                <span className="bg-yellow-100 text-yellow-900 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-yellow-300 shadow-sm">
                                  +{activeNode.keywords.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Show overall video summary when no specific node is playing
                      return (
                        <div>
                          <h4 className="font-bold text-near-black mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            Overall Video Summary:
                          </h4>
                          <ul className="list-disc list-inside space-y-2">
                            {currentData.root_topic.split(/[.!?]+/).filter(sentence => sentence.trim()).map((sentence, index) => (
                              <li key={index} className="text-near-black">
                                {sentence.trim()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                  })()}
                  </div>
                )}
              </section>
            </div>
            
            <section data-tour="mind-map" className="bg-green-100 rounded-xl shadow-lg p-2 sm:p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-near-black">
                <Map className="w-5 h-5 mr-2 text-teal-700" />
                Interactive Mind Map
              </h2>
              <MindMap
                data={currentData}
                onNodeClick={handleNodeClick}
                currentTime={currentTime}
              />
            </section>
          </div>
        )}

        {activeView === 'video' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* Left Side - Video Player */}
                <section data-tour="video-player" className="bg-blue-200 rounded-xl shadow-lg p-2 sm:p-4 h-fit">
                  <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center text-near-black">
                    <Video className="w-5 h-5 mr-2 text-blue-700" />
                    Video Player
                  </h2>
                  <VideoPlayer
                    ref={videoPlayerRef}
                    videoUrl={getVideoUrl()}
                    onTimeUpdate={handleTimeUpdate}
                    transcription={currentData.transcription}
                    showSubtitles={showTranscription}
                    onToggleSubtitles={() => setShowTranscription(!showTranscription)}
                    subtitleSize={subtitleSize}
                    onSubtitleSizeChange={setSubtitleSize}
                    mindMapData={currentData}
                    currentTime={currentTime}
                  />
                </section>

                {/* Right Side - Summary and Transcription */}
                <div className="space-y-6">
                  {/* Dynamic Summary Panel */}
                  <section className="bg-yellow-100 rounded-xl shadow-lg p-4 sm:p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center text-near-black">
                        <Brain className="w-5 h-5 mr-2 text-teal-700" />
                        Dynamic Video Summary
                      </h3>
                      <TextToSpeechButton
                        text={(() => {
                          const activeNodeIndex = currentData.nodes.findIndex(node =>
                            currentTime >= node.timestamp[0] &&
                            currentTime < node.timestamp[1]
                          );
                          return activeNodeIndex >= 0 ? currentData.nodes[activeNodeIndex].summary.join('. ') : currentData.root_topic;
                        })()}
                        title={(() => {
                          const activeNodeIndex = currentData.nodes.findIndex(node =>
                            currentTime >= node.timestamp[0] &&
                            currentTime < node.timestamp[1]
                          );
                          return activeNodeIndex >= 0 ? "Listen to current segment summary" : "Listen to video description";
                        })()}
                        variant="primary"
                        size="md"
                      />
                    </div>
                    <div className="text-near-black leading-relaxed text-sm sm:text-base font-medium space-y-4 min-h-0">
                      {/* Show currently playing node summary if available */}
                      {(() => {
                        const activeNodeIndex = currentData.nodes.findIndex(node => 
                          currentTime >= node.timestamp[0] && 
                          currentTime < node.timestamp[1]
                        );
                        if (activeNodeIndex >= 0) {
                          const activeNode = currentData.nodes[activeNodeIndex];
                          return (
                            <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border-l-4 border-yellow-500">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                                <h4 className="font-bold text-yellow-900">Currently Playing:</h4>
                                <span className="text-xs sm:text-sm bg-yellow-100 text-yellow-900 px-2 py-1 rounded-full font-medium">
                                  {Math.floor(activeNode.timestamp[0] / 60)}:{(Math.floor(activeNode.timestamp[0] % 60)).toString().padStart(2, '0')} - {Math.floor(activeNode.timestamp[1] / 60)}:{(Math.floor(activeNode.timestamp[1] % 60)).toString().padStart(2, '0')}
                                </span>
                              </div>
                              <h5 className="font-bold text-near-black mb-2 text-sm sm:text-base">{activeNode.topic}</h5>
                              <div className="text-near-black leading-relaxed">
                                <ul className="list-disc list-inside space-y-1">
                                  {activeNode.summary.map((point, index) => (
                                    <li key={index} className="text-near-black text-sm sm:text-base">
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {activeNode.keywords.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {activeNode.keywords.slice(0, 4).map((keyword, index) => (
                                    <span key={index} className="bg-yellow-100 text-yellow-900 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-yellow-300 shadow-sm hover:bg-yellow-200 transition-colors">
                                      {keyword}
                                    </span>
                                  ))}
                                  {activeNode.keywords.length > 4 && (
                                    <span className="bg-yellow-100 text-yellow-900 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-yellow-300 shadow-sm">
                                      +{activeNode.keywords.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          // Show overall video summary when no specific node is playing
                          return (
                            <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                              <h4 className="font-bold text-near-black mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                Overall Video Summary:
                              </h4>
                              <ul className="list-disc list-inside space-y-2">
                                {currentData.root_topic.split(/[.!?]+/).filter(sentence => sentence.trim()).map((sentence, index) => (
                                  <li key={index} className="text-near-black text-sm sm:text-base">
                                    {sentence.trim()}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    <div className="mt-4 p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs sm:text-sm text-near-black font-bold">
                        <strong>Tip:</strong> The summary above changes based on the current video timestamp!
                      </p>
                      <p className="text-sm text-near-black mt-2">
                        <strong>Current time:</strong> {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                      </p>
                      <p className="text-sm text-near-black mt-1">
                        <strong>Dataset:</strong> {currentData.nodes.length} nodes {uploadedData ? '(Custom)' : '(Built-in)'}
                      </p>
                    </div>
                  </section>

                  {/* Transcription Panel */}
                  {currentData.transcription && Array.isArray(currentData.transcription) && currentData.transcription.length > 0 && (
                    <section>
                      <TranscriptionPanel
                        transcription={currentData.transcription}
                        currentTime={currentTime}
                        isVisible={showTranscription}
                        onToggleVisibility={() => setShowTranscription(!showTranscription)}
                      />
                    </section>
                  )}
                </div>
              </div>
        )}

        {activeView === 'mindmap' && (
          <div className="w-full">
            <section data-tour="mind-map" className="bg-green-100 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-near-black">
                <Map className="w-5 h-5 mr-2 text-teal-700" />
                Interactive Mind Map
              </h2>
              <MindMap
                data={currentData}
                onNodeClick={handleNodeClick}
                currentTime={currentTime}
              />
            </section>
          </div>
        )}
        </>
      </main>
      
      {/* JSON Upload Modal */}
      {showJsonUpload && (
        <JsonUpload
          onDataLoaded={handleDataLoaded}
          onClose={() => setShowJsonUpload(false)}
        />
      )}
      
      {/* Video Mind Map Generator Modal */}
      {showVideoGenerator && (
        <VideoMindMapGenerator
          onDataLoaded={handleVideoGeneratorDataLoaded}
          onClose={() => setShowVideoGenerator(false)}
        />
      )}
      
      {/* Quick Tour */}
      {hasAcceptedEthics && (
        <QuickTour
        isOpen={showTour}
        onClose={handleCloseTour}
        viewMode={activeView}
        />
      )}
      
      {hasAcceptedEthics && (
        <BiasReportModal
        isOpen={showBiasReport}
        onClose={() => setShowBiasReport(false)}
        contextData={biasReportContext}
        />
      )}
        </div>
      )}
      
      {/* Show loading screen while ethics not accepted */}
      {ethicsChecked && !hasAcceptedEthics && !showEthicsDisclaimer && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading VideoMind...</p>
          </div>
        </div>
      )}
      
      {/* Show loading screen while checking ethics status */}
      {!ethicsChecked && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing VideoMind...</p>
          </div>
        </div>
      )}
    </>
  );
}

export default App;