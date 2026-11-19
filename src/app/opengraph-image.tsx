import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #0d0d0d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'white',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '38px', fontWeight: '900', color: 'black',
            letterSpacing: '-2px',
          }}>
            Z
          </div>
          <span style={{
            fontSize: '64px', fontWeight: '800',
            color: 'white', letterSpacing: '-3px',
          }}>
            FileZen
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '26px', color: '#999999',
          margin: '0 0 44px 0', textAlign: 'center', letterSpacing: '-0.5px',
        }}>
          All-in-one file toolkit — runs entirely in your browser
        </p>

        {/* Feature chips */}
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          justifyContent: 'center', maxWidth: '900px',
        }}>
          {[
            'Image Convert', 'PDF Edit', 'Photo Booth',
            'AI Upscale', 'GIF Maker', 'OCR', 'Background Remove',
          ].map((feat) => (
            <div
              key={feat}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '100px',
                padding: '10px 22px',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '20px',
                letterSpacing: '-0.3px',
              }}
            >
              {feat}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute', bottom: '44px',
          display: 'flex', alignItems: 'center', gap: '8px',
          color: '#555555', fontSize: '18px',
        }}>
          <span>filezen.app</span>
          <span style={{ color: '#333333' }}>·</span>
          <span>No uploads · Privacy first · Free</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
