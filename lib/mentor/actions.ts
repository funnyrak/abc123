'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/dal'
import {
  CareerListSchema,
  EducationListSchema,
  MentorProfileFormState,
  MentorProfileSchema,
} from '@/lib/validation/mentor'

export async function updateMentorProfile(
  _state: MentorProfileFormState,
  formData: FormData
): Promise<MentorProfileFormState> {
  const profile = await requireProfile('mentor')

  const validated = MentorProfileSchema.safeParse({
    company: formData.get('company'),
    department: formData.get('department'),
    position: formData.get('position'),
    jobFunction: formData.getAll('jobFunction'),
    industry: formData.getAll('industry'),
    mainDuties: formData.get('mainDuties'),
    mentoringFields: formData.get('mentoringFields'),
    bio: formData.get('bio'),
    region: formData.get('region'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  let careerRows: unknown[] = []
  let educationRows: unknown[] = []
  try {
    careerRows = JSON.parse((formData.get('careerJson') as string) || '[]')
    educationRows = JSON.parse((formData.get('educationJson') as string) || '[]')
  } catch {
    return { message: '경력/학력 데이터를 처리하지 못했습니다.' }
  }

  const careerParsed = CareerListSchema.safeParse(careerRows)
  const educationParsed = EducationListSchema.safeParse(educationRows)

  if (!careerParsed.success) {
    return { message: '경력 사항을 다시 확인해주세요.' }
  }
  if (!educationParsed.success) {
    return { message: '학력 사항을 다시 확인해주세요.' }
  }

  const supabase = await createClient()
  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  if (!mentorProfile) {
    return { message: '멘토 프로필을 찾을 수 없습니다.' }
  }

  const { company, department, position, jobFunction, industry, mainDuties, mentoringFields, bio, region } =
    validated.data

  const { error: updateError } = await supabase
    .from('mentor_profiles')
    .update({
      company,
      department: department || null,
      position,
      job_function: jobFunction,
      industry,
      main_duties: mainDuties,
      mentoring_fields: mentoringFields.split(',').map((f) => f.trim()).filter(Boolean),
      bio: bio || null,
      region: region || null,
    })
    .eq('id', mentorProfile.id)

  if (updateError) {
    return { message: updateError.message }
  }

  await supabase.from('mentor_careers').delete().eq('mentor_id', mentorProfile.id)
  if (careerParsed.data.length > 0) {
    await supabase.from('mentor_careers').insert(
      careerParsed.data.map((c) => ({
        mentor_id: mentorProfile.id,
        start_year: c.startYear,
        end_year: c.endYear ?? null,
        organization: c.organization,
        description: c.description || null,
      }))
    )
  }

  await supabase.from('mentor_educations').delete().eq('mentor_id', mentorProfile.id)
  if (educationParsed.data.length > 0) {
    await supabase.from('mentor_educations').insert(
      educationParsed.data.map((e) => ({
        mentor_id: mentorProfile.id,
        degree_type: e.degreeType,
        school_name: e.schoolName,
        major: e.major || null,
        graduation_year: e.graduationYear ?? null,
      }))
    )
  }

  revalidatePath('/mentor/profile')
  return { message: '프로필을 저장했습니다.' }
}
