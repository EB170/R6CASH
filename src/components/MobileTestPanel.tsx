import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { DepositModal } from './DepositModal'
import { CreateGameModal } from './CreateGameModal'
import { Smartphone, Tablet, Monitor, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'

export const MobileTestPanel = () => {
  const { isMobile, isTablet, isDesktop, screenSize, isLandscape, isPortrait } = useMobileDetection()
  const [modalTest, setModalTest] = useState<'deposit' | 'create' | null>(null)
  const [touchTests, setTouchTests] = useState({
    tap: false,
    longPress: false,
    scroll: false
  })

  const handleTouchTest = (type: keyof typeof touchTests) => {
    setTouchTests(prev => ({ ...prev, [type]: true }))
  }

  const resetTests = () => {
    setTouchTests({ tap: false, longPress: false, scroll: false })
  }

  const testResults = [
    {
      name: 'Détection d\'appareil',
      status: isMobile || isTablet ? 'success' : 'info',
      value: isMobile ? 'Mobile' : isTablet ? 'Tablette' : 'Desktop'
    },
    {
      name: 'Résolution écran',
      status: screenSize.width > 0 ? 'success' : 'error',
      value: `${screenSize.width}x${screenSize.height}`
    },
    {
      name: 'Orientation',
      status: 'info',
      value: isLandscape ? 'Paysage' : 'Portrait'
    },
    {
      name: 'Touch Events',
      status: touchTests.tap && touchTests.scroll ? 'success' : 'warning',
      value: 'ontouchstart' in window ? 'Supporté' : 'Non supporté'
    }
  ]

  return (
    <div className="space-y-6">
      <Card className="shadow-card gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neon">
            {isMobile && <Smartphone className="h-5 w-5" />}
            {isTablet && <Tablet className="h-5 w-5" />}
            {isDesktop && <Monitor className="h-5 w-5" />}
            Test Responsive Mobile
          </CardTitle>
          <CardDescription>
            Vérification de la compatibilité mobile et des fonctionnalités tactiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de l'appareil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="font-medium">{test.name}</span>
                <div className="flex items-center gap-2">
                  {test.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {test.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {test.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                  <Badge variant={test.status === 'success' ? 'default' : 'secondary'}>
                    {test.value}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Tests d'interaction tactile */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Tests d'Interaction</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                onClick={() => handleTouchTest('tap')}
                variant={touchTests.tap ? 'default' : 'outline'}
                className="touch-friendly h-16"
              >
                {touchTests.tap && <CheckCircle className="h-4 w-4 mr-2" />}
                Test Tap
              </Button>
              
              <Button
                onTouchStart={() => handleTouchTest('longPress')}
                onMouseDown={() => handleTouchTest('longPress')}
                variant={touchTests.longPress ? 'default' : 'outline'}
                className="touch-friendly h-16"
              >
                {touchTests.longPress && <CheckCircle className="h-4 w-4 mr-2" />}
                Test Long Press
              </Button>
              
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm cursor-pointer min-h-16 flex items-center justify-center"
                onTouchMove={() => handleTouchTest('scroll')}
                onScroll={() => handleTouchTest('scroll')}
              >
                {touchTests.scroll && <CheckCircle className="h-4 w-4 mr-2" />}
                Test Scroll
              </div>
            </div>
            
            <Button
              onClick={resetTests}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser les tests
            </Button>
          </div>

          {/* Tests de modales */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Tests de Modales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DepositModal onDeposit={() => {}} userBalance={100} />
              <CreateGameModal onGameCreated={() => {}} userBalance={100} />
            </div>
          </div>

          {/* Viewport info */}
          <div className="p-4 bg-secondary/30 rounded-lg">
            <h3 className="text-lg font-bold mb-2">Informations Viewport</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Largeur: {screenSize.width}px</div>
              <div>Hauteur: {screenSize.height}px</div>
              <div>Ratio: {(screenSize.width / screenSize.height).toFixed(2)}</div>
              <div>DPR: {window.devicePixelRatio}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}