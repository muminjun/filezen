import { DrawerLayout } from '@/components/layout/DrawerLayout';
import { ImagePage } from '@/components/image/ImagePage';
import { FilePage } from '@/components/file/FilePage';
import { CollagePage } from '@/components/collage/CollagePage';
import { ConvertPage } from '@/components/convert/ConvertPage';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <DrawerLayout
      imageTab={<ImagePage />}
      fileTab={<FilePage />}
      collageTab={<CollagePage />}
      convertTab={<ConvertPage />}
    />
  );
}
