import { getSchoolOrNull } from '../../layout';
import SchoolProfileForm from './client-form';

export default async function SchoolProfilePage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolOrNull(schoolSlug);
  if (!school) return <div>Không tìm thấy trường học.</div>;

  return (
    <SchoolProfileForm
      initialData={{
        name: school.name,
        logoUrl: school.logoUrl,
        phone: school.phone,
        email: school.email,
        address: school.address,
        taxCode: school.taxCode,
        legalRepresentative: school.legalRepresentative,
        description: school.description,
      }}
    />
  );
}