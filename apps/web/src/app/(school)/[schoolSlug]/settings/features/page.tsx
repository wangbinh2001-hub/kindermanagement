import { getSchoolOrNull } from '../../layout';
import SchoolFeaturesForm from './client-form';

export default async function SchoolFeaturesPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolOrNull(schoolSlug);
  if (!school) return <div>Không tìm thấy trường học.</div>;

  return (
    <SchoolFeaturesForm
      initialData={{
        enableAttendance: school.setting?.enableAttendance ?? true,
        enableTuition: school.setting?.enableTuition ?? true,
        enableHealth: school.setting?.enableHealth ?? true,
        enableNutrition: school.setting?.enableNutrition ?? false,
      }}
    />
  );
}