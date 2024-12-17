from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from .forms import UserRegistrationForm

def landing_page(request):
    return render(request, 'Accounts/landing_page.html')

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            login(request, user)
            return redirect("/projects/select")  # Redirect to the home page after registration
    else:
        form = UserRegistrationForm()
    return render(request, 'registration/register.html', {'form': form})
